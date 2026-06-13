import { pgTable, serial, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const roundMethodEnum = pgEnum("round_method", ["nfc", "manual"]);

export const wardenRoundsTable = pgTable("warden_rounds", {
  id: serial("id").primaryKey(),
  wardenId: integer("warden_id").notNull(),
  roomId: integer("room_id").notNull(),
  method: roundMethodEnum("method").notNull().default("manual"),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
});

export const insertWardenRoundSchema = createInsertSchema(wardenRoundsTable).omit({ id: true, timestamp: true });
export type InsertWardenRound = z.infer<typeof insertWardenRoundSchema>;
export type WardenRound = typeof wardenRoundsTable.$inferSelect;
