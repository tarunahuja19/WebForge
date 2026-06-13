import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import {
  personalityProfilesTable,
  studentsTable,
  roomsTable,
  blocksTable,
  roomAllocationsTable,
  usersTable,
  roommateProfilesTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { redis } from "../lib/redis";

const router = Router();

// ─── In-Memory Cache Optimization for Redis Bandwidth & CPU ─────────────────
let inMemoryProfiles: any[] = [];
let lastCacheFetchTime = 0;
const CACHE_TTL = 3600000; // 1 hour in ms

// ─── Encoder and Matcher Configuration ───────────────────────────────────────

const weights: Record<string, number> = {
  cleanliness: 2.0,
  sleep_sin: 1.8,
  sleep_cos: 1.8,
  noise_tolerance: 1.5,
  diet_eggetarian: 1.3,
  diet_no_pref: 1.3,
  diet_nonveg: 1.3,
  diet_veg: 1.3,
  diet_vegan: 1.3,
};

function encodeProfile(p: {
  gender: string;
  year: string;
  studyHoursPerDay: number;
  diet: string;
  cleanliness: number;
  noiseTolerance: number;
  guestFreq: string;
  introvertExtrovert: number;
  studyTime: string;
  sleepingTime: string;
}): number[] {
  const yearMap: Record<string, number> = {
    "1st year": 0.0,
    "2nd year": 1 / 3,
    "3rd year": 2 / 3,
    "4th year": 1.0,
  };
  const guestMap: Record<string, number> = {
    never: 0.0,
    sometimes: 0.5,
    often: 1.0,
  };

  const genderOptions = ["Female", "Male", "Non-binary"];
  const dietOptions = ["eggetarian", "no_pref", "nonveg", "veg", "vegan"];
  const studyTimeOptions = ["afternoon", "morning", "night"];

  const studyHours = (p.studyHoursPerDay - 1.0) / 9.0;
  const cleanliness = (p.cleanliness - 1.0) / 4.0;
  const noiseTolerance = (p.noiseTolerance - 1.0) / 4.0;
  const introvertExtrovert = (p.introvertExtrovert - 1.0) / 4.0;
  const year = yearMap[p.year] ?? 0.0;
  const guestFreq = guestMap[p.guestFreq] ?? 0.0;

  const rawVals: Record<string, number> = {
    study_hours_per_day: studyHours,
    cleanliness: cleanliness,
    noise_tolerance: noiseTolerance,
    introvert_extrovert: introvertExtrovert,
    year: year,
    guest_freq: guestFreq,
  };

  for (const g of genderOptions) {
    rawVals[`gender_${g}`] = p.gender === g ? 1.0 : 0.0;
  }
  for (const d of dietOptions) {
    rawVals[`diet_${d}`] = p.diet === d ? 1.0 : 0.0;
  }
  for (const s of studyTimeOptions) {
    rawVals[`study_time_${s}`] = p.studyTime === s ? 1.0 : 0.0;
  }

  let sleepHour = 0;
  if (
    p.sleepingTime.includes(":") &&
    (p.sleepingTime.toUpperCase().includes("AM") ||
      p.sleepingTime.toUpperCase().includes("PM"))
  ) {
    const parts = p.sleepingTime.trim().split(/\s+/);
    if (parts.length === 2) {
      const [hStr, mStr] = parts[0].split(":");
      let h = parseInt(hStr, 10) % 12;
      const m = parseInt(mStr, 10);
      if (parts[1].toUpperCase() === "PM") h += 12;
      sleepHour = h + m / 60.0;
    }
  } else if (p.sleepingTime.includes(":")) {
    const [h, m] = p.sleepingTime.split(":").map(Number);
    sleepHour = (h || 0) + (m || 0) / 60.0;
  } else {
    sleepHour = parseFloat(p.sleepingTime) || 0;
  }

  const sleepRad = (2.0 * Math.PI * sleepHour) / 24.0;
  rawVals["sleep_sin"] = Math.sin(sleepRad);
  rawVals["sleep_cos"] = Math.cos(sleepRad);

  const features = [
    "study_hours_per_day",
    "cleanliness",
    "noise_tolerance",
    "introvert_extrovert",
    "year",
    "guest_freq",
  ];
  for (const g of genderOptions) features.push(`gender_${g}`);
  for (const d of dietOptions) features.push(`diet_${d}`);
  for (const s of studyTimeOptions) features.push(`study_time_${s}`);
  features.push("sleep_sin", "sleep_cos");

  const queryVec: number[] = [];
  for (const feat of features) {
    const w = weights[feat] ?? 1.0;
    queryVec.push(rawVals[feat] * w);
  }
  return queryVec;
}

function cosineDistance(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 1.0;
  return 1.0 - dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function mapDbProfileToRaw(p: any) {
  let gender = "Male";
  if (p.gender === "female") gender = "Female";
  if (p.gender === "non_binary") gender = "Non-binary";

  const years = ["1st year", "2nd year", "3rd year", "4th year"];
  const year = years[p.year - 1] || "1st year";

  let diet = "no_pref";
  if (p.dietaryPreference === "vegetarian") diet = "veg";
  if (p.dietaryPreference === "non-vegetarian") diet = "nonveg";
  if (p.dietaryPreference === "eggetarian") diet = "eggetarian";
  if (p.dietaryPreference === "vegan") diet = "vegan";

  const guestFreq = p.guestFrequency || "sometimes";

  return {
    name: p.name,
    gender,
    year,
    studyHoursPerDay: p.studyHours,
    diet,
    cleanliness: p.cleanliness,
    noiseTolerance: p.noiseTolerance,
    guestFreq,
    introvertExtrovert: p.introvertExtrovert,
    studyTime: p.studyTime,
    sleepingTime: p.sleepTime,
    wakeTime: p.wakeTime,
    course: p.course,
  };
}

// ─── Check if student has personality profile ───────────────────────────────

router.get("/:studentId", async (req: Request, res: Response) => {
  const studentId = Number(req.params.studentId);
  if (!studentId) {
    res.status(400).json({ error: "Invalid studentId" });
    return;
  }
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

// ─── Submit personality test & run KNN matching ─────────────────────────────

router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      studentId,
      name,
      age,
      gender,
      year,
      course,
      sleepTime,
      wakeTime,
      studyHours,
      dietaryPreference,
      cleanliness,
      noiseTolerance,
      guestFrequency,
      introvertExtrovert,
      studyTime,
      comfortableWithGuests,
    } = req.body;

    if (!studentId) {
      res.status(400).json({ error: "studentId required" });
      return;
    }

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
    const [profile] = await db
      .insert(personalityProfilesTable)
      .values({
        studentId: Number(studentId),
        name,
        age: Number(age),
        gender,
        year: Number(year),
        course,
        sleepTime,
        wakeTime,
        studyHours: Number(studyHours),
        dietaryPreference,
        cleanliness: Number(cleanliness),
        noiseTolerance: Number(noiseTolerance),
        guestFrequency,
        introvertExtrovert: Number(introvertExtrovert),
        studyTime,
        comfortableWithGuests: Boolean(comfortableWithGuests),
      })
      .returning();

    // Map current student profile for matching
    const rawQuery = mapDbProfileToRaw(profile);
    const queryVector = encodeProfile(rawQuery);

    // ─── Fetch Roommate Dataset with Redis Caching and In-Memory Optimization ───
    const nowTime = Date.now();
    const CACHE_TTL = 3600000; // 1 hour in ms

    if (inMemoryProfiles.length === 0 || (nowTime - lastCacheFetchTime > CACHE_TTL)) {
      let roommateProfilesRaw = await redis.get("roommate_profiles");

      if (roommateProfilesRaw) {
        inMemoryProfiles = typeof roommateProfilesRaw === "string" ? JSON.parse(roommateProfilesRaw) : roommateProfilesRaw;
        lastCacheFetchTime = nowTime;
      } else {
        const dbProfiles = await db.select().from(roommateProfilesTable);
        
        inMemoryProfiles = dbProfiles.map(other => ({
          name: other.name,
          gender: other.gender,
          course: other.course,
          year: other.year,
          cleanliness: other.cleanliness,
          noiseTolerance: other.noiseTolerance,
          introvertExtrovert: other.introvertExtrovert,
          vector: encodeProfile({
            gender: other.gender,
            year: other.year,
            studyHoursPerDay: other.studyHoursPerDay,
            diet: other.diet,
            cleanliness: other.cleanliness,
            noiseTolerance: other.noiseTolerance,
            guestFreq: other.guestFreq,
            introvertExtrovert: other.introvertExtrovert,
            studyTime: other.studyTime,
            sleepingTime: other.sleepingTime,
          })
        }));

        await redis.set(
          "roommate_profiles",
          JSON.stringify(inMemoryProfiles),
          { ex: 86400 } // Cache for 24 hours in Upstash Redis
        );
        lastCacheFetchTime = nowTime;
      }
    }

    // ─── KNN matching ────────────────────────────────────────────────────────
    const scoredMatches: { distance: number; profile: any }[] = [];

    for (const other of inMemoryProfiles) {
      // Strict gender matching constraint: boys and girls are placed in separate hostels/rooms
      if (other.gender !== rawQuery.gender) continue;

      const dist = cosineDistance(queryVector, other.vector);
      scoredMatches.push({ distance: dist, profile: other });
    }

    // Sort by distance ascending
    scoredMatches.sort((a, b) => a.distance - b.distance);

    const bestMatch = scoredMatches.length > 0 ? scoredMatches[0] : null;

    // Find the best available room
    const availableRooms = await db
      .select()
      .from(roomsTable)
      .where(eq(roomsTable.status, "available"));

    let assignedRoom = availableRooms.length > 0 ? availableRooms[0] : null;

    if (bestMatch && availableRooms.length > 0) {
      const goodRoom = availableRooms.find((r: any) => r.capacity >= 2);
      assignedRoom = goodRoom || availableRooms[0];
    }

    let roommates: any[] = [];
    let matchScore = 0;

    if (assignedRoom) {
      // Assign current student to room
      await db
        .update(studentsTable)
        .set({ roomId: assignedRoom.id, blockId: assignedRoom.blockId })
        .where(eq(studentsTable.id, Number(studentId)));

      await db
        .insert(roomAllocationsTable)
        .values({ studentId: Number(studentId), roomId: assignedRoom.id });

      if (bestMatch && assignedRoom.capacity >= 2) {
        matchScore = Math.round((1.0 - bestMatch.distance) * 100);

        // Map matched roommate dataset record to users & students tables so they are a valid student in the room!
        const rmEmail = `${bestMatch.profile.name.toLowerCase().replace(/\s+/g, ".")}@student.edu`;
        let [rmUser] = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.email, rmEmail))
          .limit(1);

        let rmStudentId: number;

        if (!rmUser) {
          [rmUser] = await db
            .insert(usersTable)
            .values({
              name: bestMatch.profile.name,
              email: rmEmail,
              passwordHash: "hashed_student123",
              role: "student",
              phone: "8765432" + Math.floor(Math.random() * 900 + 100),
            })
            .returning();

          const yearMapping: Record<string, number> = {
            "1st year": 1,
            "2nd year": 2,
            "3rd year": 3,
            "4th year": 4,
          };
          const mappedYear = yearMapping[bestMatch.profile.year] ?? 1;

          const [newStudent] = await db
            .insert(studentsTable)
            .values({
              userId: rmUser.id,
              rollNumber: "RM" + Math.floor(Math.random() * 90000 + 10000),
              year: mappedYear,
              department: bestMatch.profile.course,
              roomId: assignedRoom.id,
              blockId: assignedRoom.blockId,
              status: "active",
              wellbeingScore: 80,
            })
            .returning();
          rmStudentId = newStudent.id;
        } else {
          const [existingStudent] = await db
            .select()
            .from(studentsTable)
            .where(eq(studentsTable.userId, rmUser.id))
            .limit(1);

          if (existingStudent) {
            await db
              .update(studentsTable)
              .set({ roomId: assignedRoom.id, blockId: assignedRoom.blockId })
              .where(eq(studentsTable.id, existingStudent.id));
            rmStudentId = existingStudent.id;
          } else {
            const yearMapping: Record<string, number> = {
              "1st year": 1,
              "2nd year": 2,
              "3rd year": 3,
              "4th year": 4,
            };
            const mappedYear = yearMapping[bestMatch.profile.year] ?? 1;

            const [newStudent] = await db
              .insert(studentsTable)
              .values({
                userId: rmUser.id,
                rollNumber: "RM" + Math.floor(Math.random() * 90000 + 10000),
                year: mappedYear,
                department: bestMatch.profile.course,
                roomId: assignedRoom.id,
                blockId: assignedRoom.blockId,
                status: "active",
                wellbeingScore: 80,
              })
              .returning();
            rmStudentId = newStudent.id;
          }
        }

        // Insert into room allocations
        await db
          .insert(roomAllocationsTable)
          .values({ studentId: rmStudentId, roomId: assignedRoom.id });

        roommates = [
          {
            id: rmStudentId,
            name: bestMatch.profile.name,
            compatibility: matchScore,
            traits: {
              cleanliness: bestMatch.profile.cleanliness,
              noiseTolerance: bestMatch.profile.noiseTolerance,
              introvertExtrovert: bestMatch.profile.introvertExtrovert,
            },
          },
        ];

        // Check if room is full
        const occupants = await db
          .select()
          .from(studentsTable)
          .where(eq(studentsTable.roomId, assignedRoom.id));
        if (occupants.length >= assignedRoom.capacity) {
          await db
            .update(roomsTable)
            .set({ status: "full" })
            .where(eq(roomsTable.id, assignedRoom.id));
        }
      } else {
        const occupants = await db
          .select()
          .from(studentsTable)
          .where(eq(studentsTable.roomId, assignedRoom.id));
        if (occupants.length >= assignedRoom.capacity) {
          await db
            .update(roomsTable)
            .set({ status: "full" })
            .where(eq(roomsTable.id, assignedRoom.id));
        }
      }

      const [block] = await db
        .select()
        .from(blocksTable)
        .where(eq(blocksTable.id, assignedRoom.blockId))
        .limit(1);

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
        },
      });
    } else {
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
          message:
            "All rooms are currently full. You will be assigned when a room becomes available.",
        },
      });
    }
  } catch (err: any) {
    console.error("Personality submit error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

export default router;
