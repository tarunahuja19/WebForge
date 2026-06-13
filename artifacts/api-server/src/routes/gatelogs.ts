import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { gateLogsTable, studentsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

export const gateLogRouter = Router();

async function getStudentName(studentId: number): Promise<string> {
  const [s] = await db.select().from(studentsTable).where(eq(studentsTable.id, studentId)).limit(1);
  if (!s) return "Unknown";
  const [u] = await db.select().from(usersTable).where(eq(usersTable.id, s.userId)).limit(1);
  return u?.name ?? "Unknown";
}

gateLogRouter.get("/", async (req: Request, res: Response) => {
  const conditions = [];
  if (req.query.studentId) conditions.push(eq(gateLogsTable.studentId, Number(req.query.studentId)));
  if (req.query.date) conditions.push(eq(gateLogsTable.timestamp, new Date(req.query.date as string)));
  const logs = conditions.length ? await db.select().from(gateLogsTable).where(and(...conditions)) : await db.select().from(gateLogsTable);
  const enriched = await Promise.all(logs.map(async l => ({ ...l, studentName: await getStudentName(l.studentId) })));
  res.json(enriched);
});

gateLogRouter.post("/", async (req: Request, res: Response) => {
  const { studentId, gatePassId, type, method, isTailgating } = req.body;
  const [log] = await db.insert(gateLogsTable).values({ studentId, gatePassId: gatePassId ?? null, type, method, isTailgating: isTailgating ?? false }).returning();
  res.status(201).json({ ...log, studentName: await getStudentName(log.studentId) });
});
