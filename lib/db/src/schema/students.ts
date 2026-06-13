import { pgTable, text, serial, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const studentStatusEnum = pgEnum("student_status", ["active", "on_leave", "vacated"]);

export const studentsTable = pgTable("students", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  rollNumber: text("roll_number").notNull().unique(),
  year: integer("year").notNull(),
  department: text("department").notNull(),
  roomId: integer("room_id"),
  blockId: integer("block_id"),
  emergencyContact: text("emergency_contact"),
  parentEmail: text("parent_email"),
  status: studentStatusEnum("status").notNull().default("active"),
  wellbeingScore: integer("wellbeing_score").default(80),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertStudentSchema = createInsertSchema(studentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof studentsTable.$inferSelect;
