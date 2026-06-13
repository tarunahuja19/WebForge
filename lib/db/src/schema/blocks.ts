import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const blocksTable = pgTable("blocks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  wardenId: integer("warden_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBlockSchema = createInsertSchema(blocksTable).omit({ id: true, createdAt: true });
export type InsertBlock = z.infer<typeof insertBlockSchema>;
export type Block = typeof blocksTable.$inferSelect;
