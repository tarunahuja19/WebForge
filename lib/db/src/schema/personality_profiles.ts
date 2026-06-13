import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const personalityProfilesTable = pgTable("personality_profiles", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().unique(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender").notNull(), // male, female, non-binary
  year: integer("year").notNull(), // 1-4
  course: text("course").notNull(),
  sleepTime: text("sleep_time").notNull(), // e.g. "23:00"
  wakeTime: text("wake_time").notNull(), // e.g. "07:00"
  studyHours: integer("study_hours").notNull(),
  dietaryPreference: text("dietary_preference").notNull(), // vegetarian, non-vegetarian, eggetarian, vegan, no_preference
  cleanliness: integer("cleanliness").notNull(), // 1-5
  noiseTolerance: integer("noise_tolerance").notNull(), // 1-5
  guestFrequency: text("guest_frequency").notNull(), // never, sometimes, often
  introvertExtrovert: integer("introvert_extrovert").notNull(), // 1-5
  studyTime: text("study_time").notNull(), // morning, afternoon, night
  comfortableWithGuests: boolean("comfortable_with_guests").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPersonalityProfileSchema = createInsertSchema(personalityProfilesTable).omit({ id: true, createdAt: true });
export type InsertPersonalityProfile = z.infer<typeof insertPersonalityProfileSchema>;
export type PersonalityProfile = typeof personalityProfilesTable.$inferSelect;
