import { pgTable, text, serial, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
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

export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true, lastActive: true });

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
