import { pgTable, text, serial, integer, timestamp, pgEnum, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const complaintCategoryEnum = pgEnum("complaint_category", ["plumbing", "electrical", "furniture", "hygiene", "other"]);
export const complaintStatusEnum = pgEnum("complaint_status", ["raised", "acknowledged", "in_progress", "resolved"]);
export const complaintPriorityEnum = pgEnum("complaint_priority", ["low", "medium", "high"]);

export const complaintsTable = pgTable("complaints", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  category: complaintCategoryEnum("category").notNull(),
  description: text("description").notNull(),
  roomNumber: text("room_number").notNull(),
  blockId: integer("block_id"),
  photoUrl: text("photo_url"),
  status: complaintStatusEnum("status").notNull().default("raised"),
  assignedTo: text("assigned_to"),
  priority: complaintPriorityEnum("priority").notNull().default("medium"),
  slaHours: integer("sla_hours").notNull().default(48),
  isOverdue: boolean("is_overdue").notNull().default(false),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const complaintMessagesTable = pgTable("complaint_messages", {
  id: serial("id").primaryKey(),
  complaintId: integer("complaint_id").notNull(),
  senderId: integer("sender_id").notNull(),
  senderRole: text("sender_role").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertComplaintSchema = createInsertSchema(complaintsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertComplaint = z.infer<typeof insertComplaintSchema>;
export type Complaint = typeof complaintsTable.$inferSelect;

export const insertComplaintMessageSchema = createInsertSchema(complaintMessagesTable).omit({ id: true, createdAt: true });
export type InsertComplaintMessage = z.infer<typeof insertComplaintMessageSchema>;
export type ComplaintMessage = typeof complaintMessagesTable.$inferSelect;
