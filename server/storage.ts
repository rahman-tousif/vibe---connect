import { profiles, groups, messages, type Profile, type InsertProfile, type Group, type InsertGroup, type Message, type InsertMessage } from "@shared/schema";
import { hasDb } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  createProfile(profile: InsertProfile): Promise<Profile>;
  getProfile(id: number): Promise<Profile | undefined>;
  updateLocation(id: number, latitude: number, longitude: number): Promise<Profile>;
  
  createGroup(group: InsertGroup): Promise<Group>;
  getGroup(id: number): Promise<Group | undefined>;
  listGroups(): Promise<Group[]>;
  updateGroupVideo(id: number, videoUrl: string, isPlaying: boolean, playbackTime: number): Promise<Group>;
  
  createMessage(message: InsertMessage): Promise<Message>;
  listGroupMessages(groupId: number): Promise<Message[]>;
}

export class DatabaseStorage implements IStorage {
  async createProfile(insertProfile: InsertProfile): Promise<Profile> {
    const { db } = await import("./db");
    const [profile] = await db.insert(profiles).values(insertProfile).returning();
    return profile;
  }

  async getProfile(id: number): Promise<Profile | undefined> {
    const { db } = await import("./db");
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, id));
    return profile;
  }

  async updateLocation(id: number, latitude: number, longitude: number): Promise<Profile> {
    const { db } = await import("./db");
    const [profile] = await db
      .update(profiles)
      .set({ latitude, longitude, lastActive: new Date() })
      .where(eq(profiles.id, id))
      .returning();
    return profile;
  }

  async createGroup(insertGroup: InsertGroup): Promise<Group> {
    const { db } = await import("./db");
    const [group] = await db.insert(groups).values(insertGroup).returning();
    return group;
  }

  async getGroup(id: number): Promise<Group | undefined> {
    const { db } = await import("./db");
    const [group] = await db.select().from(groups).where(eq(groups.id, id));
    return group;
  }

  async listGroups(): Promise<Group[]> {
    const { db } = await import("./db");
    return await db.select().from(groups).orderBy(desc(groups.memberCount));
  }

  async updateGroupVideo(id: number, videoUrl: string, isPlaying: boolean, playbackTime: number): Promise<Group> {
    const { db } = await import("./db");
    const [group] = await db
      .update(groups)
      .set({ currentVideoUrl: videoUrl, isPlaying, playbackTime })
      .where(eq(groups.id, id))
      .returning();
    return group;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const { db } = await import("./db");
    const [message] = await db.insert(messages).values(insertMessage).returning();
    return message;
  }

  async listGroupMessages(groupId: number): Promise<Message[]> {
    const { db } = await import("./db");
    return await db.select().from(messages).where(eq(messages.groupId, groupId));
  }
}

export class MemoryStorage implements IStorage {
  private profiles: Profile[] = [];
  private groups: Group[] = [];
  private messages: Message[] = [];
  private nextProfileId = 1;
  private nextGroupId = 1;
  private nextMessageId = 1;

  async createProfile(input: InsertProfile): Promise<Profile> {
    const profile: Profile = {
      id: this.nextProfileId++,
      nickname: input.nickname,
      bio: input.bio ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      isOnline: input.isOnline ?? true,
      lastActive: new Date(),
    };
    this.profiles.push(profile);
    return profile;
  }

  async getProfile(id: number): Promise<Profile | undefined> {
    return this.profiles.find((p) => p.id === id);
  }

  async updateLocation(id: number, latitude: number, longitude: number): Promise<Profile> {
    const profile = this.profiles.find((p) => p.id === id);
    if (!profile) throw new Error("Profile not found");
    profile.latitude = latitude;
    profile.longitude = longitude;
    profile.lastActive = new Date();
    return profile;
  }

  async createGroup(input: InsertGroup): Promise<Group> {
    const group: Group = {
      id: this.nextGroupId++,
      name: input.name,
      description: input.description ?? null,
      region: input.region ?? "North America",
      tags: input.tags ?? null,
      thumbnailUrl: input.thumbnailUrl ?? null,
      hostName: input.hostName ?? null,
      memberCount: input.memberCount ?? 0,
      maxMembers: input.maxMembers ?? 20,
      isLive: input.isLive ?? true,
      currentVideoUrl: input.currentVideoUrl ?? null,
      isPlaying: input.isPlaying ?? false,
      playbackTime: input.playbackTime ?? 0,
      createdAt: new Date(),
    };
    this.groups.push(group);
    return group;
  }

  async getGroup(id: number): Promise<Group | undefined> {
    return this.groups.find((g) => g.id === id);
  }

  async listGroups(): Promise<Group[]> {
    return [...this.groups].sort((a, b) => (b.memberCount ?? 0) - (a.memberCount ?? 0));
  }

  async updateGroupVideo(id: number, videoUrl: string, isPlaying: boolean, playbackTime: number): Promise<Group> {
    const group = this.groups.find((g) => g.id === id);
    if (!group) throw new Error("Group not found");
    group.currentVideoUrl = videoUrl;
    group.isPlaying = isPlaying;
    group.playbackTime = playbackTime;
    return group;
  }

  async createMessage(input: InsertMessage): Promise<Message> {
    const message: Message = {
      id: this.nextMessageId++,
      groupId: input.groupId ?? null,
      profileId: input.profileId ?? null,
      content: input.content,
      isAd: input.isAd ?? false,
      createdAt: new Date(),
    };
    this.messages.push(message);
    return message;
  }

  async listGroupMessages(groupId: number): Promise<Message[]> {
    return this.messages.filter((m) => m.groupId === groupId);
  }
}

export const storage: IStorage = hasDb ? new DatabaseStorage() : new MemoryStorage();
