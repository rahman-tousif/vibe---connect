import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { WebSocketServer, WebSocket } from "ws";

interface QueueUser {
  ws: WebSocket;
  profileId: number;
  latitude?: number;
  longitude?: number;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.post(api.profiles.create.path, async (req, res) => {
    try {
      const input = api.profiles.create.input.parse(req.body);
      const profile = await storage.createProfile(input);
      res.status(201).json(profile);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.patch(api.profiles.updateLocation.path, async (req, res) => {
    try {
      const { latitude, longitude } = api.profiles.updateLocation.input.parse(req.body);
      const profileId = Number(req.params.id);
      if (isNaN(profileId)) {
        return res.status(400).json({ message: "Invalid profile ID" });
      }
      const profile = await storage.updateLocation(profileId, latitude, longitude);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      res.status(200).json(profile);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.get(api.groups.list.path, async (_req, res) => {
    const groups = await storage.listGroups();
    res.json(groups);
  });

  app.post(api.groups.create.path, async (req, res) => {
    const input = api.groups.create.input.parse(req.body);
    const group = await storage.createGroup(input);
    res.status(201).json(group);
  });

  app.get(api.groups.get.path, async (req, res) => {
    const group = await storage.getGroup(Number(req.params.id));
    if (!group) return res.status(404).json({ message: "Group not found" });
    res.json(group);
  });

  app.get(api.groups.messages.list.path, async (req, res) => {
    const messages = await storage.listGroupMessages(Number(req.params.id));
    res.json(messages);
  });

  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  let queue: QueueUser[] = [];
  const activeChats = new Map<string, WebSocket>();
  const groupClients = new Map<number, Set<{ws: WebSocket, profileId: number}>>();

  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const rad = Math.PI / 180;
    const dLat = (lat2 - lat1) * rad;
    const dLon = (lon2 - lon1) * rad;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * rad) * Math.cos(lat2 * rad) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function findMatch(user: QueueUser): QueueUser | null {
    if (queue.length === 0) return null;
    if (user.latitude !== undefined && user.longitude !== undefined) {
      let closest: QueueUser | null = null;
      let minDistance = Infinity;
      let closestIndex = -1;
      for (let i = 0; i < queue.length; i++) {
        const potentialMatch = queue[i];
        if (potentialMatch.latitude !== undefined && potentialMatch.longitude !== undefined) {
          const dist = calculateDistance(user.latitude, user.longitude, potentialMatch.latitude, potentialMatch.longitude);
          if (dist < minDistance) {
            minDistance = dist;
            closest = potentialMatch;
            closestIndex = i;
          }
        }
      }
      if (closest && closestIndex !== -1) {
        queue.splice(closestIndex, 1);
        return closest;
      }
    }
    return queue.shift() || null;
  }

  wss.on("connection", (ws) => {
    let currentProfileId: number | null = null;
    let currentPartnerWs: WebSocket | null = null;
    let currentGroupId: number | null = null;
    const wsId = Math.random().toString(36).substring(7);
    activeChats.set(wsId, ws);

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        const { type, payload } = message;

        if (type === "joinQueue") {
          const { profileId, latitude, longitude } = payload;
          currentProfileId = profileId;
          if (currentPartnerWs) {
             currentPartnerWs.send(JSON.stringify({ type: "chatEnded", payload: {} }));
             currentPartnerWs = null;
          }
          queue = queue.filter(q => q.ws !== ws);
          const user: QueueUser = { ws, profileId, latitude, longitude };
          const match = findMatch(user);
          if (match) {
            const partnerWs = match.ws;
            const partnerProfile = await storage.getProfile(match.profileId);
            const myProfile = await storage.getProfile(profileId);
            currentPartnerWs = partnerWs;
            const partnerWsId = [...activeChats.entries()].find(([k, v]) => v === partnerWs)?.[0];
            ws.send(JSON.stringify({
              type: "matched",
              payload: { partnerId: partnerWsId, partnerProfile, initiator: true }
            }));
            partnerWs.send(JSON.stringify({
              type: "matched",
              payload: { partnerId: wsId, partnerProfile: myProfile, initiator: false }
            }));
          } else {
            queue.push(user);
          }
        } else if (type === "leaveQueue") {
           queue = queue.filter(q => q.ws !== ws);
        } else if (["offer", "answer", "iceCandidate", "endChat"].includes(type)) {
           const targetWs = activeChats.get(payload.targetId);
           if (targetWs && targetWs.readyState === WebSocket.OPEN) {
             if (type === "endChat") {
               currentPartnerWs = null;
               targetWs.send(JSON.stringify({ type: "chatEnded", payload: {} }));
             } else {
               targetWs.send(JSON.stringify({
                 type,
                 payload: { ...payload, senderId: wsId }
               }));
             }
           }
        } 
        // Group Logic
        else if (type === "joinGroup") {
          const { groupId, profileId } = payload;
          currentGroupId = groupId;
          currentProfileId = profileId;
          if (!groupClients.has(groupId)) groupClients.set(groupId, new Set());
          const clients = groupClients.get(groupId)!;
          clients.add({ ws, profileId });
          const profile = await storage.getProfile(profileId);
          clients.forEach(c => {
            if (c.ws !== ws && c.ws.readyState === WebSocket.OPEN) {
              c.ws.send(JSON.stringify({ type: "userJoinedGroup", payload: { profileId, profile } }));
            }
          });
        } else if (type === "sendMessage") {
          const { groupId, profileId, content } = payload;
          const isAd = Math.random() < 0.2; // 20% chance of ad
          const msg = await storage.createMessage({ groupId, profileId, content, isAd });
          if (isAd) {
             const adMsg = await storage.createMessage({ groupId, profileId: null as any, content: "Sponsered: Check out our new premium features!", isAd: true });
             const clients = groupClients.get(groupId);
             clients?.forEach(c => {
               if (c.ws.readyState === WebSocket.OPEN) {
                 c.ws.send(JSON.stringify({ type: "newMessage", payload: { message: adMsg } }));
               }
             });
          }
          const clients = groupClients.get(groupId);
          clients?.forEach(c => {
            if (c.ws.readyState === WebSocket.OPEN) {
              c.ws.send(JSON.stringify({ type: "newMessage", payload: { message: msg } }));
            }
          });
        } else if (type === "updateVideo") {
          const { groupId, videoUrl, isPlaying, playbackTime } = payload;
          await storage.updateGroupVideo(groupId, videoUrl, isPlaying, playbackTime);
          const clients = groupClients.get(groupId);
          clients?.forEach(c => {
            if (c.ws !== ws && c.ws.readyState === WebSocket.OPEN) {
              c.ws.send(JSON.stringify({ type: "videoUpdated", payload: { videoUrl, isPlaying, playbackTime } }));
            }
          });
        }
      } catch (err) {
        console.error("WebSocket message error:", err);
      }
    });

    ws.on("close", () => {
      queue = queue.filter((q) => q.ws !== ws);
      activeChats.delete(wsId);
      if (currentPartnerWs && currentPartnerWs.readyState === WebSocket.OPEN) {
        currentPartnerWs.send(JSON.stringify({ type: "chatEnded", payload: {} }));
      }
      if (currentGroupId && currentProfileId) {
        const clients = groupClients.get(currentGroupId);
        if (clients) {
          [...clients].forEach(c => {
            if (c.ws === ws) clients.delete(c);
          });
        }
      }
    });
  });

  return httpServer;
}
