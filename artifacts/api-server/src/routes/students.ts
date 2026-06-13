import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { studentsTable, usersTable, blocksTable, roomsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

async function enrichStudent(s: typeof studentsTable.$inferSelect) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, s.userId)).limit(1);
  let roomNumber: string | null = null;
  let blockName: string | null = null;
  if (s.roomId) {
    const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, s.roomId)).limit(1);
    if (room) roomNumber = room.roomNumber;
  }
  if (s.blockId) {
    const [block] = await db.select().from(blocksTable).where(eq(blocksTable.id, s.blockId)).limit(1);
    if (block) blockName = block.name;
  }
  return {
    ...s,
    name: user?.name ?? "Unknown",
    email: user?.email ?? "",
    avatar: user?.avatar ?? null,
    phone: user?.phone ?? null,
    roomNumber,
    blockName,
    feeStatus: "pending" as string,
  };
}

router.get("/", async (req: Request, res: Response) => {
  let query = db.select().from(studentsTable);
  const conditions = [];
  if (req.query.blockId) conditions.push(eq(studentsTable.blockId, Number(req.query.blockId)));
  if (req.query.status) conditions.push(eq(studentsTable.status, req.query.status as "active" | "on_leave" | "vacated"));
  const raw = conditions.length ? await query.where(and(...conditions)) : await query;
  const enriched = await Promise.all(raw.map(enrichStudent));
  res.json(enriched);
});

router.post("/", async (req: Request, res: Response) => {
  const { name, email, password, rollNumber, year, department, phone, emergencyContact, parentEmail } = req.body;
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing) { res.status(400).json({ error: "Email already exists" }); return; }
  const [user] = await db.insert(usersTable).values({ name, email, passwordHash: "hashed_" + password, role: "student", phone }).returning();
  const [student] = await db.insert(studentsTable).values({ userId: user.id, rollNumber, year, department, emergencyContact, parentEmail }).returning();
  const enriched = await enrichStudent(student);
  res.status(201).json(enriched);
});

router.get("/:id", async (req: Request, res: Response) => {
  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, Number(req.params.id))).limit(1);
  if (!student) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await enrichStudent(student));
});

router.patch("/:id", async (req: Request, res: Response) => {
  const { status } = req.body;
  const [updated] = await db.update(studentsTable).set({ status }).where(eq(studentsTable.id, Number(req.params.id))).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await enrichStudent(updated));
});

router.get("/:id/wellbeing", async (req: Request, res: Response) => {
  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, Number(req.params.id))).limit(1);
  if (!student) { res.status(404).json({ error: "Not found" }); return; }
  const score = student.wellbeingScore ?? 80;
  const flags: string[] = [];
  if (score < 60) flags.push("Low mess participation");
  if (score < 50) flags.push("Unusual gate activity");
  res.json({
    studentId: student.id,
    score,
    flags,
    messSkips: Math.floor(Math.random() * 5),
    lateEntries: Math.floor(Math.random() * 3),
    complaintCount: Math.floor(Math.random() * 4),
    lastActivity: new Date(Date.now() - Math.random() * 86400000 * 2).toISOString(),
    trend: score > 70 ? "stable" : "declining",
  });
});

export default router;
