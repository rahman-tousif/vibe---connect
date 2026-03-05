import { profiles, type Profile, type InsertProfile } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  createProfile(profile: InsertProfile): Promise<Profile>;
  getProfile(id: number): Promise<Profile | undefined>;
  updateLocation(id: number, latitude: number, longitude: number): Promise<Profile>;
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
}

export const storage = new DatabaseStorage();
