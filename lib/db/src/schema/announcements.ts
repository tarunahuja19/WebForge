import { pgTable, text, serial, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const announcementTargetEnum = pgEnum("announcement_target", ["all", "student", "warden", "admin", "parent", "gate_staff"]);
export const announcementPriorityEnum = pgEnum("announcement_priority", ["normal", "urgent"]);

export const announcementsTable = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  targetRole: announcementTargetEnum("target_role").notNull().default("all"),
  priority: announcementPriorityEnum("priority").notNull().default("normal"),
  createdById: integer("created_by_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAnnouncementSchema = createInsertSchema(announcementsTable).omit({ id: true, createdAt: true });
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type Announcement = typeof announcementsTable.$inferSelect;
