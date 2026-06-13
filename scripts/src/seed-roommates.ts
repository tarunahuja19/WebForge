import { db } from "@workspace/db";
import { roommateProfilesTable } from "@workspace/db";
import fs from "node:fs";
import path from "node:path";

async function seedRoommates() {
  console.log("Seeding roommate_profiles from CSV...");

  // Path to roommate_data.csv
  const csvPath = path.resolve(import.meta.dirname, "../../roommate-model/roommate_data.csv");
  if (!fs.existsSync(csvPath)) {
    console.error(`Error: CSV file not found at ${csvPath}`);
    process.exit(1);
  }

  // Clear existing profiles
  await db.delete(roommateProfilesTable);
  console.log("Cleared existing roommate profiles.");

  const fileContent = fs.readFileSync(csvPath, "utf-8");
  const lines = fileContent.split("\n");

  // Filter out headers and empty lines
  const dataLines = lines.slice(1).filter(line => line.trim() !== "");

  console.log(`Found ${dataLines.length} profiles to insert.`);

  // Parse lines
  const batchSize = 200;
  let currentBatch: any[] = [];
  let totalInserted = 0;

  for (const line of dataLines) {
    const parts = line.split(",");
    if (parts.length < 15) continue;

    const [
      name,
      ageStr,
      gender,
      year,
      course,
      sleepingTime,
      wakeTime,
      studyHoursStr,
      diet,
      cleanlinessStr,
      noiseToleranceStr,
      guestFreq,
      introvertExtrovertStr,
      studyTime,
      friendsInRoom
    ] = parts;

    currentBatch.push({
      name: name.trim(),
      age: parseInt(ageStr.trim(), 10),
      gender: gender.trim(),
      year: year.trim(),
      course: course.trim(),
      sleepingTime: sleepingTime.trim(),
      wakeTime: wakeTime.trim(),
      studyHoursPerDay: parseInt(studyHoursStr.trim(), 10),
      diet: diet.trim(),
      cleanliness: parseInt(cleanlinessStr.trim(), 10),
      noiseTolerance: parseInt(noiseToleranceStr.trim(), 10),
      guestFreq: guestFreq.trim(),
      introvertExtrovert: parseInt(introvertExtrovertStr.trim(), 10),
      studyTime: studyTime.trim(),
      friendsInRoom: friendsInRoom.trim()
    });

    if (currentBatch.length >= batchSize) {
      await db.insert(roommateProfilesTable).values(currentBatch);
      totalInserted += currentBatch.length;
      console.log(`Inserted ${totalInserted}/${dataLines.length} profiles...`);
      currentBatch = [];
    }
  }

  if (currentBatch.length > 0) {
    await db.insert(roommateProfilesTable).values(currentBatch);
    totalInserted += currentBatch.length;
    console.log(`Inserted ${totalInserted}/${dataLines.length} profiles.`);
  }

  console.log("Roommate profiles seeded successfully!");
  process.exit(0);
}

seedRoommates().catch(err => {
  console.error("Error seeding roommates:", err);
  process.exit(1);
});
