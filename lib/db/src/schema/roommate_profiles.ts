import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const roommateProfilesTable = pgTable("roommate_profiles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender").notNull(),
  year: text("year").notNull(),
  course: text("course").notNull(),
  sleepingTime: text("sleeping_time").notNull(),
  wakeTime: text("wake_time").notNull(),
  studyHoursPerDay: integer("study_hours_per_day").notNull(),
  diet: text("diet").notNull(),
  cleanliness: integer("cleanliness").notNull(),
  noiseTolerance: integer("noise_tolerance").notNull(),
  guestFreq: text("guest_freq").notNull(),
  introvertExtrovert: integer("introvert_extrovert").notNull(),
  studyTime: text("study_time").notNull(),
  friendsInRoom: text("friends_in_room").notNull(),
});

export const insertRoommateProfileSchema = createInsertSchema(roommateProfilesTable).omit({ id: true });
export type InsertRoommateProfile = z.infer<typeof insertRoommateProfileSchema>;
export type RoommateProfile = typeof roommateProfilesTable.$inferSelect;
