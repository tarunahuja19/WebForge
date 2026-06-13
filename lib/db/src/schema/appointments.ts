import { pgTable, text, serial, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const appointmentTypeEnum = pgEnum("appointment_type", ["virtual", "in_person"]);
export const appointmentStatusEnum = pgEnum("appointment_status", ["pending", "confirmed", "completed", "cancelled"]);

export const appointmentsTable = pgTable("appointments", {
  id: serial("id").primaryKey(),
  wardenId: integer("warden_id").notNull(),
  studentId: integer("student_id").notNull(),
  requestedBy: integer("requested_by").notNull(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  type: appointmentTypeEnum("type").notNull().default("in_person"),
  status: appointmentStatusEnum("status").notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAppointmentSchema = createInsertSchema(appointmentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointmentsTable.$inferSelect;
