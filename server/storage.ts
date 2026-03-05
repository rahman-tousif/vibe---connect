import { profiles, groups, messages, type Profile, type InsertProfile, type Group, type InsertGroup, type Message, type InsertMessage } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  createProfile(profile: InsertProfile): Promise<Profile>;
  getProfile(id: number): Promise<Profile | undefined>;
  updateLocation(id: number, latitude: number, longitude: number): Promise<Profile>;
  
  // Groups
  createGroup(group: InsertGroup): Promise<Group>;
  getGroup(id: number): Promise<Group | undefined>;
  listGroups(): Promise<Group[]>;
  updateGroupVideo(id: number, videoUrl: string, isPlaying: boolean, playbackTime: number): Promise<Group>;
  
  // Messages
  createMessage(message: InsertMessage): Promise<Message>;
  listGroupMessages(groupId: number): Promise<Message[]>;
}

export class DatabaseStorage implements IStorage {
  async createProfile(insertProfile: InsertProfile): Promise<Profile> {
    const [profile] = await db.insert(profiles).values(insertProfile).returning();
    return profile;
  }

  async getProfile(id: number): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, id));
    return profile;
  }

  async updateLocation(id: number, latitude: number, longitude: number): Promise<Profile> {
    const [profile] = await db
      .update(profiles)
      .set({ latitude, longitude, lastActive: new Date() })
      .where(eq(profiles.id, id))
      .returning();
    return profile;
  }

  async createGroup(insertGroup: InsertGroup): Promise<Group> {
    const [group] = await db.insert(groups).values(insertGroup).returning();
    return group;
  }

  async getGroup(id: number): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.id, id));
    return group;
  }

  async listGroups(): Promise<Group[]> {
    return await db.select().from(groups);
  }

  async updateGroupVideo(id: number, videoUrl: string, isPlaying: boolean, playbackTime: number): Promise<Group> {
    const [group] = await db
      .update(groups)
      .set({ currentVideoUrl: videoUrl, isPlaying, playbackTime })
      .where(eq(groups.id, id))
      .returning();
    return group;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(insertMessage).returning();
    return message;
  }

  async listGroupMessages(groupId: number): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.groupId, groupId));
  }
}

export const storage = new DatabaseStorage();
