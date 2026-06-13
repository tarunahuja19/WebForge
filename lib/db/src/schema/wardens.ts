import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const wardensTable = pgTable("wardens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  blockId: integer("block_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertWardenSchema = createInsertSchema(wardensTable).omit({ id: true, createdAt: true });
export type InsertWarden = z.infer<typeof insertWardenSchema>;
export type Warden = typeof wardensTable.$inferSelect;
