import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { WebSocketServer, WebSocket } from "ws";
import { REGIONS } from "@shared/schema";

const SEED_GROUPS = [
  { name: "LA Night Owls", description: "Late night vibes from the west coast", region: "North America", tags: "chill,night,music", hostName: "NightRider23", memberCount: 14, maxMembers: 25, isLive: true, thumbnailUrl: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&h=300&fit=crop" },
  { name: "NYC Underground", description: "The city that never sleeps", region: "North America", tags: "urban,party,social", hostName: "BigApple99", memberCount: 22, maxMembers: 30, isLive: true, thumbnailUrl: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=400&h=300&fit=crop" },
  { name: "Miami Heat Lounge", description: "Tropical vibes and good times", region: "North America", tags: "tropical,lounge,party", hostName: "SunnyMiami", memberCount: 9, maxMembers: 20, isLive: true, thumbnailUrl: "https://images.unsplash.com/photo-1514214246283-d427a95c5d2f?w=400&h=300&fit=crop" },
  { name: "Toronto After Dark", description: "Canadian nights, global energy", region: "North America", tags: "night,chill,diverse", hostName: "MapleVibes", memberCount: 7, maxMembers: 15, isLive: true, thumbnailUrl: "https://images.unsplash.com/photo-1517090504332-af4389908681?w=400&h=300&fit=crop" },
  { name: "Chicago Blues Room", description: "Soulful conversations and music", region: "North America", tags: "music,blues,chill", hostName: "WindyCityJay", memberCount: 5, maxMembers: 15, isLive: false, thumbnailUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop" },

  { name: "London Calling", description: "Proper banter and good company", region: "Europe", tags: "social,banter,uk", hostName: "BigBenVibes", memberCount: 18, maxMembers: 25, isLive: true, thumbnailUrl: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=300&fit=crop" },
  { name: "Berlin Techno Club", description: "Underground electronic vibes", region: "Europe", tags: "techno,music,night", hostName: "BerlinBeat", memberCount: 31, maxMembers: 50, isLive: true, thumbnailUrl: "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=400&h=300&fit=crop" },
  { name: "Paris Après Minuit", description: "Midnight conversations in the city of light", region: "Europe", tags: "romantic,night,culture", hostName: "ParisienNuit", memberCount: 12, maxMembers: 20, isLive: true, thumbnailUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=300&fit=crop" },
  { name: "Barcelona Fiesta", description: "Mediterranean energy 24/7", region: "Europe", tags: "party,fiesta,social", hostName: "CatalanSol", memberCount: 8, maxMembers: 20, isLive: false, thumbnailUrl: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&h=300&fit=crop" },

  { name: "Tokyo Neon Nights", description: "Akihabara energy, Shibuya style", region: "Asia", tags: "anime,neon,culture", hostName: "TokyoDrift", memberCount: 27, maxMembers: 40, isLive: true, thumbnailUrl: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop" },
  { name: "Seoul K-Wave", description: "K-pop, K-drama, K-vibes", region: "Asia", tags: "kpop,culture,social", hostName: "SeoulStar", memberCount: 19, maxMembers: 30, isLive: true, thumbnailUrl: "https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=400&h=300&fit=crop" },
  { name: "Mumbai Midnight", description: "Bollywood beats and late night talks", region: "Asia", tags: "bollywood,music,chat", hostName: "DesiNight", memberCount: 15, maxMembers: 25, isLive: true, thumbnailUrl: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=400&h=300&fit=crop" },
  { name: "Bangkok Pulse", description: "Southeast Asian nightlife vibes", region: "Asia", tags: "nightlife,social,tropical", hostName: "ThaiPulse", memberCount: 6, maxMembers: 20, isLive: false, thumbnailUrl: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400&h=300&fit=crop" },

  { name: "São Paulo Funk", description: "Brazilian beats and carnival energy", region: "South America", tags: "funk,party,carnival", hostName: "BrazilBeat", memberCount: 20, maxMembers: 30, isLive: true, thumbnailUrl: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=400&h=300&fit=crop" },
  { name: "Buenos Aires Tango", description: "Passionate vibes from Argentina", region: "South America", tags: "tango,culture,night", hostName: "TangoKing", memberCount: 11, maxMembers: 20, isLive: true, thumbnailUrl: "https://images.unsplash.com/photo-1612294037637-ec328d0e075e?w=400&h=300&fit=crop" },
  { name: "Bogotá Beats", description: "Colombian rhythms and energy", region: "South America", tags: "reggaeton,music,social", hostName: "ColombiaSon", memberCount: 4, maxMembers: 15, isLive: false, thumbnailUrl: "https://images.unsplash.com/photo-1518659526054-190340b32735?w=400&h=300&fit=crop" },

  { name: "Lagos Afrobeats", description: "The heartbeat of African nightlife", region: "Africa", tags: "afrobeats,music,party", hostName: "NaijaVibes", memberCount: 16, maxMembers: 25, isLive: true, thumbnailUrl: "https://images.unsplash.com/photo-1489749798305-4fea3ae63f23?w=400&h=300&fit=crop" },
  { name: "Cape Town Sunset", description: "South African beauty and vibes", region: "Africa", tags: "sunset,chill,social", hostName: "CapeVibes", memberCount: 8, maxMembers: 20, isLive: true, thumbnailUrl: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=400&h=300&fit=crop" },

  { name: "Sydney Harbour", description: "Aussie good times down under", region: "Oceania", tags: "beach,social,chill", hostName: "AussieVibes", memberCount: 10, maxMembers: 20, isLive: true, thumbnailUrl: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=400&h=300&fit=crop" },
  { name: "Auckland Nights", description: "Kiwi vibes and Pacific energy", region: "Oceania", tags: "pacific,night,chill", hostName: "KiwiNights", memberCount: 3, maxMembers: 15, isLive: false, thumbnailUrl: "https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=400&h=300&fit=crop" },

  { name: "Dubai Luxe Lounge", description: "Premium vibes from the desert oasis", region: "Middle East", tags: "luxury,lounge,night", hostName: "DesertGold", memberCount: 13, maxMembers: 20, isLive: true, thumbnailUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=300&fit=crop" },
  { name: "Istanbul Nights", description: "Where East meets West", region: "Middle East", tags: "culture,social,night", hostName: "BosphorusVibes", memberCount: 9, maxMembers: 20, isLive: true, thumbnailUrl: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=400&h=300&fit=crop" },
];

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

  app.get(api.groups.list.path, async (req, res) => {
    const allGroups = await storage.listGroups();
    const region = req.query.region as string | undefined;
    if (region) {
      res.json(allGroups.filter(g => g.region === region));
    } else {
      res.json(allGroups);
    }
  });

  app.post(api.groups.seed.path, async (_req, res) => {
    const existing = await storage.listGroups();
    if (existing.length > 0) {
      return res.status(200).json({ message: "Groups already seeded", count: existing.length });
    }
    for (const seed of SEED_GROUPS) {
      await storage.createGroup(seed);
    }
    res.status(201).json({ message: "Seeded groups", count: SEED_GROUPS.length });
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
