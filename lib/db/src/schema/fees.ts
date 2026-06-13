import { pgTable, text, serial, integer, timestamp, pgEnum, numeric, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const feeStatusEnum = pgEnum("fee_status", ["pending", "partial", "paid", "overdue"]);

export const feeRecordsTable = pgTable("fee_records", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  month: text("month").notNull(),
  hostelFee: numeric("hostel_fee", { precision: 10, scale: 2 }).notNull(),
  messFee: numeric("mess_fee", { precision: 10, scale: 2 }).notNull(),
  electricityFee: numeric("electricity_fee", { precision: 10, scale: 2 }).notNull(),
  penaltyAmount: numeric("penalty_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  paidAmount: numeric("paid_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  status: feeStatusEnum("status").notNull().default("pending"),
  dueDate: date("due_date", { mode: "string" }).notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  receiptUrl: text("receipt_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertFeeRecordSchema = createInsertSchema(feeRecordsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFeeRecord = z.infer<typeof insertFeeRecordSchema>;
export type FeeRecord = typeof feeRecordsTable.$inferSelect;
