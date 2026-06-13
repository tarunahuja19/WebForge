import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { leaveRequestsTable, studentsTable, usersTable } from "@workspace/db";
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
  if (req.query.studentId) conditions.push(eq(leaveRequestsTable.studentId, Number(req.query.studentId)));
  if (req.query.status) conditions.push(eq(leaveRequestsTable.status, req.query.status as "pending" | "warden_approved" | "admin_approved" | "rejected"));
  const requests = conditions.length ? await db.select().from(leaveRequestsTable).where(and(...conditions)) : await db.select().from(leaveRequestsTable);
  const enriched = await Promise.all(requests.map(async r => ({ ...r, studentName: await getStudentName(r.studentId) })));
  res.json(enriched);
});

router.post("/", async (req: Request, res: Response) => {
  const { fromDate, toDate, destination, reason, emergencyContact, studentId } = req.body;
  const sid = studentId || 1;
  const [req_] = await db.insert(leaveRequestsTable).values({ studentId: sid, fromDate, toDate, destination, reason, emergencyContact }).returning();
  res.status(201).json({ ...req_, studentName: await getStudentName(req_.studentId) });
});

router.get("/:id", async (req: Request, res: Response) => {
  const [lr] = await db.select().from(leaveRequestsTable).where(eq(leaveRequestsTable.id, Number(req.params.id))).limit(1);
  if (!lr) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...lr, studentName: await getStudentName(lr.studentId) });
});

router.patch("/:id", async (req: Request, res: Response) => {
  const { status, wardenRemarks, adminRemarks } = req.body;
  const updates: Partial<typeof leaveRequestsTable.$inferInsert> = { status };
  if (wardenRemarks) updates.wardenRemarks = wardenRemarks;
  if (adminRemarks) updates.adminRemarks = adminRemarks;
  const [updated] = await db.update(leaveRequestsTable).set(updates).where(eq(leaveRequestsTable.id, Number(req.params.id))).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...updated, studentName: await getStudentName(updated.studentId) });
});

export default router;
