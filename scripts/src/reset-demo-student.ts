import { db } from "@workspace/db";
import {
  usersTable,
  studentsTable,
  roomAllocationsTable,
  personalityProfilesTable,
  roomsTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";

async function resetDemoStudent() {
  console.log("Resetting demo student Arjun Sharma (arjun@student.edu)...");

  // 1. Find user Arjun
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, "arjun@student.edu"))
    .limit(1);

  if (!user) {
    console.error("Error: Demo student user (arjun@student.edu) not found.");
    process.exit(1);
  }

  console.log(`Found user: ${user.name} (ID: ${user.id})`);

  // 2. Find student record
  const [student] = await db
    .select()
    .from(studentsTable)
    .where(eq(studentsTable.userId, user.id))
    .limit(1);

  if (!student) {
    console.error(`Error: Student record for user ID ${user.id} not found.`);
    process.exit(1);
  }

  const studentId = student.id;
  const previousRoomId = student.roomId;

  console.log(`Found student record: ID: ${studentId}, Roll Number: ${student.rollNumber}, Room ID: ${previousRoomId}`);

  // 3. Delete personality profile
  const deleteProfileRes = await db
    .delete(personalityProfilesTable)
    .where(eq(personalityProfilesTable.studentId, studentId))
    .returning();

  console.log(`Deleted ${deleteProfileRes.length} personality profile(s).`);

  // 4. Delete room allocations
  if (previousRoomId) {
    const deleteAllocRes = await db
      .delete(roomAllocationsTable)
      .where(
        and(
          eq(roomAllocationsTable.studentId, studentId),
          eq(roomAllocationsTable.roomId, previousRoomId)
        )
      )
      .returning();

    console.log(`Deleted ${deleteAllocRes.length} room allocation(s).`);
  }

  // 5. Clear student's room assignment (set roomId and blockId to null)
  const updateStudentRes = await db
    .update(studentsTable)
    .set({ roomId: null, blockId: null })
    .where(eq(studentsTable.id, studentId))
    .returning();

  console.log(`Updated student record: roomId set to ${updateStudentRes[0].roomId}, blockId set to ${updateStudentRes[0].blockId}.`);

  // 6. Handle previous room status
  if (previousRoomId) {
    // Check current occupancy of previous room
    const currentOccupants = await db
      .select()
      .from(studentsTable)
      .where(eq(studentsTable.roomId, previousRoomId));

    const [room] = await db
      .select()
      .from(roomsTable)
      .where(eq(roomsTable.id, previousRoomId))
      .limit(1);

    if (room) {
      console.log(`Previous Room (${room.roomNumber}) - Capacity: ${room.capacity}, Current Occupants: ${currentOccupants.length}`);
      if (currentOccupants.length < room.capacity && room.status === "full") {
        const updateRoomRes = await db
          .update(roomsTable)
          .set({ status: "available" })
          .where(eq(roomsTable.id, previousRoomId))
          .returning();
        console.log(`Updated room ${room.roomNumber} status from 'full' to 'available'.`);
      }
    }
  }

  console.log("Demo student's room details and personality profile reset successfully!");
  process.exit(0);
}

resetDemoStudent().catch((e) => {
  console.error("Error resetting demo student:", e);
  process.exit(1);
});
