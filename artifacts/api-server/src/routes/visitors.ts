import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { visitorRequestsTable, studentsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

async function getStudentName(studentId: number): Promise<string> {
  const [s] = await db.select().from(studentsTable).where(eq(studentsTable.id, studentId)).limit(1);
  if (!s) return "Unknown";
  const [u] = await db.select().from(usersTable).where(eq(usersTable.id, s.userId)).limit(1);
  return u?.name ?? "Unknown";
}

router.get("/", async (req: Request, res: Response) => {
  const conditions = [];
  if (req.query.studentId) conditions.push(eq(visitorRequestsTable.studentId, Number(req.query.studentId)));
  if (req.query.status) conditions.push(eq(visitorRequestsTable.status, req.query.status as "pending" | "approved" | "rejected" | "visited" | "expired"));
  const visitors = conditions.length ? await db.select().from(visitorRequestsTable).where(and(...conditions)) : await db.select().from(visitorRequestsTable);
  const enriched = await Promise.all(visitors.map(async v => ({ ...v, studentName: await getStudentName(v.studentId) })));
  res.json(enriched);
});

router.post("/", async (req: Request, res: Response) => {
  const { visitorName, relation, purpose, visitorPhone, expectedArrival, studentId } = req.body;
  const sid = studentId || 1;
  const qrCode = `VISITOR_QR_${Date.now()}_${sid}`;
  const [visitor] = await db.insert(visitorRequestsTable).values({ studentId: sid, visitorName, relation, purpose, visitorPhone, expectedArrival: new Date(expectedArrival), qrCode }).returning();
  res.status(201).json({ ...visitor, studentName: await getStudentName(visitor.studentId) });
});

router.get("/:id", async (req: Request, res: Response) => {
  const [v] = await db.select().from(visitorRequestsTable).where(eq(visitorRequestsTable.id, Number(req.params.id))).limit(1);
  if (!v) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...v, studentName: await getStudentName(v.studentId) });
});

router.patch("/:id", async (req: Request, res: Response) => {
  const { status, wardenRemarks } = req.body;
  const updates: Partial<typeof visitorRequestsTable.$inferInsert> = { status };
  if (wardenRemarks) updates.wardenRemarks = wardenRemarks;
  if (status === "visited") updates.actualArrival = new Date();
  const [updated] = await db.update(visitorRequestsTable).set(updates).where(eq(visitorRequestsTable.id, Number(req.params.id))).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...updated, studentName: await getStudentName(updated.studentId) });
});

export default router;
