import { pgTable, serial, integer, timestamp, pgEnum, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const gateLogTypeEnum = pgEnum("gate_log_type", ["entry", "exit"]);
export const gateLogMethodEnum = pgEnum("gate_log_method", ["qr", "face", "manual"]);

export const gateLogsTable = pgTable("gate_logs", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  gatePassId: integer("gate_pass_id"),
  type: gateLogTypeEnum("type").notNull(),
  method: gateLogMethodEnum("method").notNull().default("manual"),
  isTailgating: boolean("is_tailgating").notNull().default(false),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
});

export const insertGateLogSchema = createInsertSchema(gateLogsTable).omit({ id: true, timestamp: true });
export type InsertGateLog = z.infer<typeof insertGateLogSchema>;
export type GateLog = typeof gateLogsTable.$inferSelect;
