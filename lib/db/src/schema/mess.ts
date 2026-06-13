import { pgTable, text, serial, integer, timestamp, pgEnum, jsonb, boolean, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const mealTypeEnum = pgEnum("meal_type", ["breakfast", "lunch", "dinner"]);
export const messMethodEnum = pgEnum("mess_method", ["qr", "nfc", "manual"]);

export const messAttendanceTable = pgTable("mess_attendance", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  mealType: mealTypeEnum("meal_type").notNull(),
  date: date("date", { mode: "string" }).notNull(),
  tapInTime: timestamp("tap_in_time", { withTimezone: true }).notNull().defaultNow(),
  method: messMethodEnum("method").notNull().default("manual"),
});

export const messMenusTable = pgTable("mess_menus", {
  id: serial("id").primaryKey(),
  weekStart: date("week_start", { mode: "string" }).notNull(),
  items: jsonb("items").notNull().$type<Array<{ day: string; breakfast: string; lunch: string; dinner: string }>>(),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const menuVotesTable = pgTable("menu_votes", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  weekStart: date("week_start", { mode: "string" }).notNull(),
  menuItemId: text("menu_item_id").notNull(),
  preference: text("preference").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMessAttendanceSchema = createInsertSchema(messAttendanceTable).omit({ id: true, tapInTime: true });
export type InsertMessAttendance = z.infer<typeof insertMessAttendanceSchema>;
export type MessAttendance = typeof messAttendanceTable.$inferSelect;

export const insertMessMenuSchema = createInsertSchema(messMenusTable).omit({ id: true, createdAt: true });
export type InsertMessMenu = z.infer<typeof insertMessMenuSchema>;
export type MessMenu = typeof messMenusTable.$inferSelect;

export const insertMenuVoteSchema = createInsertSchema(menuVotesTable).omit({ id: true, createdAt: true });
export type InsertMenuVote = z.infer<typeof insertMenuVoteSchema>;
export type MenuVote = typeof menuVotesTable.$inferSelect;
