import { pgTable, text, serial, boolean, timestamp, doublePrecision, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  nickname: text("nickname").notNull(),
  bio: text("bio"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  isOnline: boolean("is_online").default(true),
  lastActive: timestamp("last_active").defaultNow(),
});

export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  currentVideoUrl: text("current_video_url"),
  isPlaying: boolean("is_playing").default(false),
  playbackTime: doublePrecision("playback_time").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => groups.id),
  profileId: integer("profile_id").references(() => profiles.id),
  content: text("content").notNull(),
  isAd: boolean("is_ad").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true, lastActive: true });
export const insertGroupSchema = createInsertSchema(groups).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Group = typeof groups.$inferSelect;
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
