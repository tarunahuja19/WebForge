import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { complaintsTable, complaintMessagesTable, studentsTable, usersTable } from "@workspace/db";
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
  if (req.query.studentId) conditions.push(eq(complaintsTable.studentId, Number(req.query.studentId)));
  if (req.query.status) conditions.push(eq(complaintsTable.status, req.query.status as "raised" | "acknowledged" | "in_progress" | "resolved"));
  if (req.query.category) conditions.push(eq(complaintsTable.category, req.query.category as "plumbing" | "electrical" | "furniture" | "hygiene" | "other"));
  if (req.query.blockId) conditions.push(eq(complaintsTable.blockId, Number(req.query.blockId)));
  const complaints = conditions.length ? await db.select().from(complaintsTable).where(and(...conditions)) : await db.select().from(complaintsTable);
  const enriched = await Promise.all(complaints.map(async c => ({ ...c, studentName: await getStudentName(c.studentId) })));
  res.json(enriched);
});

router.post("/", async (req: Request, res: Response) => {
  const { category, description, roomNumber, photoUrl, priority, studentId, blockId } = req.body;
  const sid = studentId || 1;
  const [complaint] = await db.insert(complaintsTable).values({ studentId: sid, category, description, roomNumber, photoUrl: photoUrl ?? null, priority: priority ?? "medium", blockId: blockId ?? null }).returning();
  res.status(201).json({ ...complaint, studentName: await getStudentName(complaint.studentId) });
});

router.get("/:id", async (req: Request, res: Response) => {
  const [c] = await db.select().from(complaintsTable).where(eq(complaintsTable.id, Number(req.params.id))).limit(1);
  if (!c) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...c, studentName: await getStudentName(c.studentId) });
});

router.patch("/:id", async (req: Request, res: Response) => {
  const { status, assignedTo } = req.body;
  const updates: Partial<typeof complaintsTable.$inferInsert> = {};
  if (status) updates.status = status;
  if (assignedTo) updates.assignedTo = assignedTo;
  if (status === "resolved") updates.resolvedAt = new Date();
  const [updated] = await db.update(complaintsTable).set(updates).where(eq(complaintsTable.id, Number(req.params.id))).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...updated, studentName: await getStudentName(updated.studentId) });
});

// Complaint Messages
router.get("/:id/messages", async (req: Request, res: Response) => {
  const messages = await db.select().from(complaintMessagesTable).where(eq(complaintMessagesTable.complaintId, Number(req.params.id)));
  const enriched = await Promise.all(messages.map(async m => {
    const [u] = await db.select().from(usersTable).where(eq(usersTable.id, m.senderId)).limit(1);
    return { ...m, senderName: u?.name ?? "Unknown" };
  }));
  res.json(enriched);
});

router.post("/:id/messages", async (req: Request, res: Response) => {
  const { message, senderId, senderRole } = req.body;
  const sid = senderId || 1;
  const [u] = await db.select().from(usersTable).where(eq(usersTable.id, sid)).limit(1);
  const [msg] = await db.insert(complaintMessagesTable).values({ complaintId: Number(req.params.id), senderId: sid, senderRole: senderRole || "student", message }).returning();
  res.status(201).json({ ...msg, senderName: u?.name ?? "Unknown" });
});

export default router;
