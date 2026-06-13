import { pgTable, serial, integer, timestamp, real, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const blockSurveysTable = pgTable("block_surveys", {
  id: serial("id").primaryKey(),
  blockId: integer("block_id").notNull(),
  studentId: integer("student_id").notNull(),
  weekStart: date("week_start", { mode: "string" }).notNull(),
  safetyScore: integer("safety_score").notNull(),
  cleanlinessScore: integer("cleanliness_score").notNull(),
  comfortScore: integer("comfort_score").notNull(),
  overallScore: real("overall_score").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBlockSurveySchema = createInsertSchema(blockSurveysTable).omit({ id: true, createdAt: true });
export type InsertBlockSurvey = z.infer<typeof insertBlockSurveySchema>;
export type BlockSurvey = typeof blockSurveysTable.$inferSelect;
