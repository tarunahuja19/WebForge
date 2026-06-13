import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { feeRecordsTable, studentsTable, usersTable } from "@workspace/db";
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
  if (req.query.studentId) conditions.push(eq(feeRecordsTable.studentId, Number(req.query.studentId)));
  if (req.query.status) conditions.push(eq(feeRecordsTable.status, req.query.status as "pending" | "partial" | "paid" | "overdue"));
  if (req.query.month) conditions.push(eq(feeRecordsTable.month, req.query.month as string));
  const fees = conditions.length ? await db.select().from(feeRecordsTable).where(and(...conditions)) : await db.select().from(feeRecordsTable);
  const enriched = await Promise.all(fees.map(async f => ({ ...f, studentName: await getStudentName(f.studentId) })));
  res.json(enriched);
});

router.post("/", async (req: Request, res: Response) => {
  const { studentId, month, hostelFee, messFee, electricityFee, penaltyAmount, dueDate } = req.body;
  const total = Number(hostelFee) + Number(messFee) + Number(electricityFee) + Number(penaltyAmount || 0);
  const [fee] = await db.insert(feeRecordsTable).values({ studentId, month, hostelFee: hostelFee.toString(), messFee: messFee.toString(), electricityFee: electricityFee.toString(), penaltyAmount: (penaltyAmount || 0).toString(), totalAmount: total.toString(), dueDate }).returning();
  res.status(201).json({ ...fee, studentName: await getStudentName(fee.studentId) });
});

router.get("/:id", async (req: Request, res: Response) => {
  const [fee] = await db.select().from(feeRecordsTable).where(eq(feeRecordsTable.id, Number(req.params.id))).limit(1);
  if (!fee) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...fee, studentName: await getStudentName(fee.studentId) });
});

router.patch("/:id", async (req: Request, res: Response) => {
  const { status, paidAmount } = req.body;
  const updates: Partial<typeof feeRecordsTable.$inferInsert> = { status };
  if (paidAmount !== undefined) updates.paidAmount = paidAmount.toString();
  if (status === "paid") updates.paidAt = new Date();
  const [updated] = await db.update(feeRecordsTable).set(updates).where(eq(feeRecordsTable.id, Number(req.params.id))).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...updated, studentName: await getStudentName(updated.studentId) });
});

export default router;
