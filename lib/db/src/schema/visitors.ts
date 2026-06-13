import { pgTable, text, serial, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const visitorStatusEnum = pgEnum("visitor_status", ["pending", "approved", "rejected", "visited", "expired"]);

export const visitorRequestsTable = pgTable("visitor_requests", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  visitorName: text("visitor_name").notNull(),
  relation: text("relation").notNull(),
  purpose: text("purpose").notNull(),
  visitorPhone: text("visitor_phone").notNull(),
  expectedArrival: timestamp("expected_arrival", { withTimezone: true }).notNull(),
  status: visitorStatusEnum("status").notNull().default("pending"),
  qrCode: text("qr_code"),
  wardenRemarks: text("warden_remarks"),
  actualArrival: timestamp("actual_arrival", { withTimezone: true }),
  actualDeparture: timestamp("actual_departure", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertVisitorRequestSchema = createInsertSchema(visitorRequestsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertVisitorRequest = z.infer<typeof insertVisitorRequestSchema>;
export type VisitorRequest = typeof visitorRequestsTable.$inferSelect;
