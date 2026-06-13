import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { blocksTable, roomsTable, studentsTable, usersTable, wardensTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";

const router = Router();

async function enrichBlock(b: typeof blocksTable.$inferSelect) {
  const rooms = await db.select().from(roomsTable).where(eq(roomsTable.blockId, b.id));
  const students = await db.select().from(studentsTable).where(eq(studentsTable.blockId, b.id));
  const occupiedRooms = rooms.filter(r => r.status === "full").length;
  let wardenName: string | null = null;
  if (b.wardenId) {
    const [warden] = await db.select().from(wardensTable).where(eq(wardensTable.id, b.wardenId)).limit(1);
    if (warden) {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, warden.userId)).limit(1);
      if (user) wardenName = user.name;
    }
  }
  return {
    ...b,
    wardenName,
    totalRooms: rooms.length,
    occupiedRooms,
    totalStudents: students.length,
    healthScore: 75 + Math.floor(Math.random() * 20),
    createdAt: new Date().toISOString(),
  };
}

router.get("/", async (_req: Request, res: Response) => {
  const blocks = await db.select().from(blocksTable);
  const enriched = await Promise.all(blocks.map(enrichBlock));
  res.json(enriched);
});

router.post("/", async (req: Request, res: Response) => {
  const [block] = await db.insert(blocksTable).values({ name: req.body.name, wardenId: req.body.wardenId ?? null }).returning();
  res.status(201).json(await enrichBlock(block));
});

router.get("/:id", async (req: Request, res: Response) => {
  const [block] = await db.select().from(blocksTable).where(eq(blocksTable.id, Number(req.params.id))).limit(1);
  if (!block) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await enrichBlock(block));
});

router.get("/:id/health-score", async (req: Request, res: Response) => {
  const blockId = Number(req.params.id);
  res.json({
    blockId,
    overall: 78,
    complaintResolution: 82,
    wardenCompliance: 90,
    feeCollection: 76,
    messParticipation: 71,
    maintenanceSla: 68,
    trend: "stable",
  });
});

export default router;
