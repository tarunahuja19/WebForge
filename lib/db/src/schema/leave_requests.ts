import { pgTable, text, serial, integer, timestamp, pgEnum, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const leaveStatusEnum = pgEnum("leave_status", ["pending", "warden_approved", "admin_approved", "rejected"]);

export const leaveRequestsTable = pgTable("leave_requests", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  fromDate: date("from_date", { mode: "string" }).notNull(),
  toDate: date("to_date", { mode: "string" }).notNull(),
  destination: text("destination").notNull(),
  reason: text("reason").notNull(),
  emergencyContact: text("emergency_contact").notNull(),
  status: leaveStatusEnum("status").notNull().default("pending"),
  wardenRemarks: text("warden_remarks"),
  adminRemarks: text("admin_remarks"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertLeaveRequestSchema = createInsertSchema(leaveRequestsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLeaveRequest = z.infer<typeof insertLeaveRequestSchema>;
export type LeaveRequest = typeof leaveRequestsTable.$inferSelect;
