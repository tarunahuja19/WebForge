import { pgTable, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const roomAllocationsTable = pgTable("room_allocations", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  roomId: integer("room_id").notNull(),
  allocatedAt: timestamp("allocated_at", { withTimezone: true }).notNull().defaultNow(),
  vacatedAt: timestamp("vacated_at", { withTimezone: true }),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertRoomAllocationSchema = createInsertSchema(roomAllocationsTable).omit({ id: true, allocatedAt: true });
export type InsertRoomAllocation = z.infer<typeof insertRoomAllocationSchema>;
export type RoomAllocation = typeof roomAllocationsTable.$inferSelect;
