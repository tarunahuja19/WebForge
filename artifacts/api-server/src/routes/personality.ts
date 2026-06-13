import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import {
  personalityProfilesTable,
  studentsTable,
  roomsTable,
  blocksTable,
  roomAllocationsTable,
  usersTable,
} from "@workspace/db";
import { eq, and, isNull } from "drizzle-orm";

const router = Router();

// ─── Feature Encoding Helpers ────────────────────────────────────────────────

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function normTime(t: string): number {
  return timeToMinutes(t) / 1440; // 0-1
}

function encodeDiet(d: string): number {
  const map: Record<string, number> = { vegetarian: 0, eggetarian: 0.25, vegan: 0.5, "no_preference": 0.75, "non-vegetarian": 1 };
  return map[d] ?? 0.5;
}

function encodeGuest(g: string): number {
  const map: Record<string, number> = { never: 0, sometimes: 0.5, often: 1 };
  return map[g] ?? 0.5;
}

function encodeStudyTime(s: string): number {
  const map: Record<string, number> = { morning: 0, afternoon: 0.5, night: 1 };
  return map[s] ?? 0.5;
}

// ─── Build Feature Vector ────────────────────────────────────────────────────

function buildFeatureVector(p: {
  sleepTime: string;
  wakeTime: string;
  studyHours: number;
  dietaryPreference: string;
  cleanliness: number;
  noiseTolerance: number;
  guestFrequency: string;
  introvertExtrovert: number;
  studyTime: string;
  comfortableWithGuests: boolean;
}): number[] {
  return [
    normTime(p.sleepTime),
    normTime(p.wakeTime),
    Math.min(p.studyHours, 16) / 16,
    encodeDiet(p.dietaryPreference),
    (p.cleanliness - 1) / 4,
    (p.noiseTolerance - 1) / 4,
    encodeGuest(p.guestFrequency),
    (p.introvertExtrovert - 1) / 4,
    encodeStudyTime(p.studyTime),
    p.comfortableWithGuests ? 1 : 0,
  ];
}

// ─── Cosine Similarity ──────────────────────────────────────────────────────

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

// ─── Check if student has personality profile ───────────────────────────────

router.get("/:studentId", async (req: Request, res: Response) => {
  const studentId = Number(req.params.studentId);
  if (!studentId) { res.status(400).json({ error: "Invalid studentId" }); return; }
  const [profile] = await db
    .select()
    .from(personalityProfilesTable)
    .where(eq(personalityProfilesTable.studentId, studentId))
    .limit(1);
  if (!profile) {
    res.json({ hasProfile: false, profile: null });
    return;
  }
  res.json({ hasProfile: true, profile });
});

// ─── Submit personality test & run AI matching ──────────────────────────────

router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      studentId, name, age, gender, year, course,
      sleepTime, wakeTime, studyHours, dietaryPreference,
      cleanliness, noiseTolerance, guestFrequency,
      introvertExtrovert, studyTime, comfortableWithGuests,
    } = req.body;

    if (!studentId) { res.status(400).json({ error: "studentId required" }); return; }

    // Check if profile already exists
    const [existing] = await db
      .select()
      .from(personalityProfilesTable)
      .where(eq(personalityProfilesTable.studentId, Number(studentId)))
      .limit(1);
    if (existing) {
      res.status(409).json({ error: "Profile already exists" });
      return;
    }

    // Save personality profile
    const [profile] = await db.insert(personalityProfilesTable).values({
      studentId: Number(studentId),
      name, age: Number(age), gender, year: Number(year), course,
      sleepTime, wakeTime, studyHours: Number(studyHours),
      dietaryPreference, cleanliness: Number(cleanliness),
      noiseTolerance: Number(noiseTolerance), guestFrequency,
      introvertExtrovert: Number(introvertExtrovert), studyTime,
      comfortableWithGuests: Boolean(comfortableWithGuests),
    }).returning();

    // ─── AI Matching ───────────────────────────────────────────────────────────

    const newVector = buildFeatureVector(profile);

    // Get all other profiles of students who DON'T have a room yet (unmatched students)
    const allProfiles = await db.select().from(personalityProfilesTable);
    const allStudents = await db.select().from(studentsTable);

    // Build compatibility scores with students who also don't have rooms
    const scores: { studentId: number; similarity: number; profile: typeof profile }[] = [];
    for (const other of allProfiles) {
      if (other.studentId === Number(studentId)) continue;
      const otherStudent = allStudents.find(s => s.id === other.studentId);
      // Prefer matching with students who don't have rooms yet
      if (otherStudent?.roomId) continue;

      const otherVector = buildFeatureVector(other);
      const sim = cosineSimilarity(newVector, otherVector);
      scores.push({ studentId: other.studentId, similarity: sim, profile: other });
    }

    // Sort by similarity descending
    scores.sort((a, b) => b.similarity - a.similarity);

    // Pick top match (for a 2-person room)
    const bestMatch = scores.length > 0 ? scores[0] : null;

    // Find the best available room
    const availableRooms = await db
      .select()
      .from(roomsTable)
      .where(eq(roomsTable.status, "available"));

    let assignedRoom = availableRooms.length > 0 ? availableRooms[0] : null;

    // If we have a best match, prefer a room that fits both
    if (bestMatch && availableRooms.length > 0) {
      // Prefer rooms with capacity >= 2
      const goodRoom = availableRooms.find(r => r.capacity >= 2);
      assignedRoom = goodRoom || availableRooms[0];
    }

    let roommates: any[] = [];
    let matchScore = 0;

    if (assignedRoom) {
      // Assign current student to room
      await db.update(studentsTable).set({ roomId: assignedRoom.id, blockId: assignedRoom.blockId }).where(eq(studentsTable.id, Number(studentId)));
      await db.insert(roomAllocationsTable).values({ studentId: Number(studentId), roomId: assignedRoom.id });

      if (bestMatch && assignedRoom.capacity >= 2) {
        // Assign best match roommate too
        await db.update(studentsTable).set({ roomId: assignedRoom.id, blockId: assignedRoom.blockId }).where(eq(studentsTable.id, bestMatch.studentId));
        await db.insert(roomAllocationsTable).values({ studentId: bestMatch.studentId, roomId: assignedRoom.id });

        matchScore = Math.round(bestMatch.similarity * 100);

        // Get roommate user info
        const [rmStudent] = await db.select().from(studentsTable).where(eq(studentsTable.id, bestMatch.studentId)).limit(1);
        const [rmUser] = rmStudent ? await db.select().from(usersTable).where(eq(usersTable.id, rmStudent.userId)).limit(1) : [null];
        roommates = [{
          id: bestMatch.studentId,
          name: rmUser?.name ?? bestMatch.profile.name,
          compatibility: matchScore,
          traits: {
            cleanliness: bestMatch.profile.cleanliness,
            noiseTolerance: bestMatch.profile.noiseTolerance,
            introvertExtrovert: bestMatch.profile.introvertExtrovert,
          }
        }];

        // Check if room is full
        const occupants = await db.select().from(studentsTable).where(eq(studentsTable.roomId, assignedRoom.id));
        if (occupants.length >= assignedRoom.capacity) {
          await db.update(roomsTable).set({ status: "full" }).where(eq(roomsTable.id, assignedRoom.id));
        }
      } else {
        // Only this student in the room — check capacity
        const occupants = await db.select().from(studentsTable).where(eq(studentsTable.roomId, assignedRoom.id));
        if (occupants.length >= assignedRoom.capacity) {
          await db.update(roomsTable).set({ status: "full" }).where(eq(roomsTable.id, assignedRoom.id));
        }
      }

      // Get block name
      const [block] = await db.select().from(blocksTable).where(eq(blocksTable.id, assignedRoom.blockId)).limit(1);

      res.json({
        success: true,
        profile,
        matchResult: {
          roomId: assignedRoom.id,
          roomNumber: assignedRoom.roomNumber,
          floor: assignedRoom.floor,
          blockName: block?.name ?? "Unknown Block",
          roommates,
          matchScore,
        }
      });
    } else {
      // No rooms available
      res.json({
        success: true,
        profile,
        matchResult: {
          roomId: null,
          roomNumber: null,
          floor: null,
          blockName: null,
          roommates: [],
          matchScore: 0,
          message: "All rooms are currently full. You will be assigned when a room becomes available."
        }
      });
    }
  } catch (err: any) {
    console.error("Personality submit error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

export default router;
