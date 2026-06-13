import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { roomsTable, blocksTable, studentsTable, usersTable, roomAllocationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

async function enrichRoom(r: typeof roomsTable.$inferSelect) {
  const [block] = await db.select().from(blocksTable).where(eq(blocksTable.id, r.blockId)).limit(1);
  const students = await db.select().from(studentsTable).where(eq(studentsTable.roomId, r.id));
  const enrichedStudents = await Promise.all(students.map(async s => {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, s.userId)).limit(1);
    return { id: s.id, name: user?.name ?? "Unknown", rollNumber: s.rollNumber };
  }));
  return {
    ...r,
    blockName: block?.name ?? null,
    currentOccupancy: students.length,
    amenities: ["WiFi", "AC", "Attached Bathroom"],
    students: enrichedStudents,
  };
}

router.get("/", async (req: Request, res: Response) => {
  const conditions = [];
  if (req.query.blockId) conditions.push(eq(roomsTable.blockId, Number(req.query.blockId)));
  if (req.query.status) conditions.push(eq(roomsTable.status, req.query.status as "available" | "full" | "maintenance"));
  const rooms = conditions.length ? await db.select().from(roomsTable).where(and(...conditions)) : await db.select().from(roomsTable);
  const enriched = await Promise.all(rooms.map(enrichRoom));
  res.json(enriched);
});

router.post("/", async (req: Request, res: Response) => {
  const [room] = await db.insert(roomsTable).values({ roomNumber: req.body.roomNumber, blockId: req.body.blockId, floor: req.body.floor, capacity: req.body.capacity }).returning();
  res.status(201).json(await enrichRoom(room));
});

// Room Allocations
router.get("/allocations/list", async (req: Request, res: Response) => {
  const conditions = [];
  if (req.query.studentId) conditions.push(eq(roomAllocationsTable.studentId, Number(req.query.studentId)));
  if (req.query.roomId) conditions.push(eq(roomAllocationsTable.roomId, Number(req.query.roomId)));
  const allocs = conditions.length ? await db.select().from(roomAllocationsTable).where(and(...conditions)) : await db.select().from(roomAllocationsTable);
  res.json(allocs);
});

router.post("/allocations", async (req: Request, res: Response) => {
  const { studentId, roomId } = req.body;
  const [alloc] = await db.insert(roomAllocationsTable).values({ studentId, roomId }).returning();
  await db.update(studentsTable).set({ roomId }).where(eq(studentsTable.id, studentId));
  const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, roomId)).limit(1);
  const [block] = room ? await db.select().from(blocksTable).where(eq(blocksTable.id, room.blockId)).limit(1) : [null];
  await db.update(studentsTable).set({ blockId: block?.id ?? null }).where(eq(studentsTable.id, studentId));
  res.status(201).json(alloc);
});

// Floor map for cinema-style room visualization
router.get("/floor-map", async (_req: Request, res: Response) => {
  const rooms = await db.select().from(roomsTable);
  const blocks = await db.select().from(blocksTable);
  const students = await db.select().from(studentsTable);

  // Group rooms by floor
  const floors: Record<number, any[]> = { 1: [], 2: [], 3: [] };

  for (const room of rooms) {
    const block = blocks.find(b => b.id === room.blockId);
    const occupants = students.filter(s => s.roomId === room.id);
    const floorNum = room.floor || 1;
    if (!floors[floorNum]) floors[floorNum] = [];
    floors[floorNum].push({
      id: room.id,
      roomNumber: room.roomNumber,
      floor: floorNum,
      blockId: room.blockId,
      blockName: block?.name ?? "Unknown",
      capacity: room.capacity,
      currentOccupancy: occupants.length,
      status: room.status,
      occupants: occupants.map(s => ({ id: s.id, rollNumber: s.rollNumber })),
    });
  }

  res.json({
    totalFloors: 3,
    floors: [
      { floor: 1, label: "Ground Floor", rooms: floors[1] || [] },
      { floor: 2, label: "First Floor", rooms: floors[2] || [] },
      { floor: 3, label: "Second Floor", rooms: floors[3] || [] },
    ]
  });
});

router.get("/:id", async (req: Request, res: Response) => {
  const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, Number(req.params.id))).limit(1);
  if (!room) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await enrichRoom(room));
});

export default router;
