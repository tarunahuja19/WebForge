import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { gatePassesTable, studentsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

export const gatePassRouter = Router();

async function getStudentName(studentId: number): Promise<string> {
  const [s] = await db.select().from(studentsTable).where(eq(studentsTable.id, studentId)).limit(1);
  if (!s) return "Unknown";
  const [u] = await db.select().from(usersTable).where(eq(usersTable.id, s.userId)).limit(1);
  return u?.name ?? "Unknown";
}

gatePassRouter.get("/", async (req: Request, res: Response) => {
  const conditions = [];
  if (req.query.studentId) conditions.push(eq(gatePassesTable.studentId, Number(req.query.studentId)));
  if (req.query.status) conditions.push(eq(gatePassesTable.status, req.query.status as "pending" | "approved" | "rejected" | "expired" | "used"));
  const passes = conditions.length ? await db.select().from(gatePassesTable).where(and(...conditions)) : await db.select().from(gatePassesTable);
  const enriched = await Promise.all(passes.map(async p => ({ ...p, studentName: await getStudentName(p.studentId) })));
  res.json(enriched);
});

gatePassRouter.post("/", async (req: Request, res: Response) => {
  const { destination, purpose, expectedReturn, studentId } = req.body;
  const sid = studentId || 1;
  const qrCode = `HOSTEL_PASS_${Date.now()}_${sid}`;
  const [pass] = await db.insert(gatePassesTable).values({ studentId: sid, destination, purpose, expectedReturn: new Date(expectedReturn), qrCode }).returning();
  res.status(201).json({ ...pass, studentName: await getStudentName(pass.studentId) });
});

gatePassRouter.get("/:id", async (req: Request, res: Response) => {
  const [pass] = await db.select().from(gatePassesTable).where(eq(gatePassesTable.id, Number(req.params.id))).limit(1);
  if (!pass) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...pass, studentName: await getStudentName(pass.studentId) });
});

gatePassRouter.patch("/:id", async (req: Request, res: Response) => {
  const { status, wardenRemarks } = req.body;
  const updates: Partial<typeof gatePassesTable.$inferInsert> = { status };
  if (wardenRemarks) updates.wardenRemarks = wardenRemarks;
  if (status === "approved") updates.approvedAt = new Date();
  const [updated] = await db.update(gatePassesTable).set(updates).where(eq(gatePassesTable.id, Number(req.params.id))).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...updated, studentName: await getStudentName(updated.studentId) });
});
