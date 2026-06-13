import { pgTable, text, serial, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const gatePassStatusEnum = pgEnum("gate_pass_status", ["pending", "approved", "rejected", "expired", "used"]);

export const gatePassesTable = pgTable("gate_passes", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  destination: text("destination").notNull(),
  purpose: text("purpose").notNull(),
  expectedReturn: timestamp("expected_return", { withTimezone: true }).notNull(),
  status: gatePassStatusEnum("status").notNull().default("pending"),
  qrCode: text("qr_code"),
  wardenRemarks: text("warden_remarks"),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertGatePassSchema = createInsertSchema(gatePassesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertGatePass = z.infer<typeof insertGatePassSchema>;
export type GatePass = typeof gatePassesTable.$inferSelect;
