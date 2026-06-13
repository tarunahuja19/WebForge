import { pgTable, text, serial, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const roomStatusEnum = pgEnum("room_status", ["available", "full", "maintenance"]);

export const roomsTable = pgTable("rooms", {
  id: serial("id").primaryKey(),
  roomNumber: text("room_number").notNull(),
  blockId: integer("block_id").notNull(),
  floor: integer("floor").notNull().default(1),
  capacity: integer("capacity").notNull().default(2),
  status: roomStatusEnum("status").notNull().default("available"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRoomSchema = createInsertSchema(roomsTable).omit({ id: true, createdAt: true });
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof roomsTable.$inferSelect;
