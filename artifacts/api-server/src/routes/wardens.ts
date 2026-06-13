import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { wardensTable, usersTable, blocksTable, studentsTable, wardenRoundsTable, blockSurveysTable, appointmentsTable, roomsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

export const wardenRouter = Router();
export const wardenRoundRouter = Router();
export const blockSurveyRouter = Router();
export const appointmentRouter = Router();

async function enrichWarden(w: typeof wardensTable.$inferSelect) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, w.userId)).limit(1);
  let blockName: string | null = null;
  if (w.blockId) {
    const [block] = await db.select().from(blocksTable).where(eq(blocksTable.id, w.blockId)).limit(1);
    if (block) blockName = block.name;
  }
  return {
    ...w,
    name: user?.name ?? "Unknown",
    email: user?.email ?? "",
    avatar: user?.avatar ?? null,
    phone: user?.phone ?? null,
    blockName,
    roundComplianceRate: 85 + Math.random() * 12,
    avgComplaintResolutionTime: 20 + Math.random() * 15,
    studentSatisfactionScore: 3.8 + Math.random() * 1.0,
    createdAt: user?.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

// Wardens
wardenRouter.get("/", async (_req: Request, res: Response) => {
  const wardens = await db.select().from(wardensTable);
  const enriched = await Promise.all(wardens.map(enrichWarden));
  res.json(enriched);
});

wardenRouter.post("/", async (req: Request, res: Response) => {
  const { name, email, password, phone, blockId } = req.body;
  const [user] = await db.insert(usersTable).values({ name, email, passwordHash: "hashed_" + password, role: "warden", phone }).returning();
  const [warden] = await db.insert(wardensTable).values({ userId: user.id, blockId: blockId ?? null }).returning();
  res.status(201).json(await enrichWarden(warden));
});

wardenRouter.get("/:id", async (req: Request, res: Response) => {
  const [warden] = await db.select().from(wardensTable).where(eq(wardensTable.id, Number(req.params.id))).limit(1);
  if (!warden) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await enrichWarden(warden));
});

wardenRouter.get("/:id/at-risk-students", async (req: Request, res: Response) => {
  const wardenId = Number(req.params.id);
  const [warden] = await db.select().from(wardensTable).where(eq(wardensTable.id, wardenId)).limit(1);
  if (!warden || !warden.blockId) { res.json([]); return; }
  const students = await db.select().from(studentsTable).where(eq(studentsTable.blockId, warden.blockId));
  const atRisk = await Promise.all(students
    .filter(s => (s.wellbeingScore ?? 80) < 70)
    .map(async s => {
      const [u] = await db.select().from(usersTable).where(eq(usersTable.id, s.userId)).limit(1);
      const [room] = s.roomId ? await db.select().from(roomsTable).where(eq(roomsTable.id, s.roomId)).limit(1) : [null];
      return {
        studentId: s.id,
        name: u?.name ?? "Unknown",
        roomNumber: room?.roomNumber ?? "N/A",
        riskLevel: (s.wellbeingScore ?? 80) < 50 ? "high" : (s.wellbeingScore ?? 80) < 60 ? "medium" : "low",
        reason: "Low wellbeing signals detected",
        lastActivity: new Date(Date.now() - Math.random() * 172800000).toISOString(),
        wellbeingScore: s.wellbeingScore ?? 80,
      };
    }));
  res.json(atRisk);
});

// Warden Rounds
wardenRoundRouter.get("/", async (req: Request, res: Response) => {
  const conditions = [];
  if (req.query.wardenId) conditions.push(eq(wardenRoundsTable.wardenId, Number(req.query.wardenId)));
  const rounds = conditions.length ? await db.select().from(wardenRoundsTable).where(and(...conditions)) : await db.select().from(wardenRoundsTable);
  const enriched = await Promise.all(rounds.map(async r => {
    const [warden] = await db.select().from(wardensTable).where(eq(wardensTable.id, r.wardenId)).limit(1);
    const [user] = warden ? await db.select().from(usersTable).where(eq(usersTable.id, warden.userId)).limit(1) : [null];
    const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, r.roomId)).limit(1);
    return { ...r, wardenName: user?.name ?? "Unknown", roomNumber: room?.roomNumber ?? "N/A" };
  }));
  res.json(enriched);
});

wardenRoundRouter.post("/", async (req: Request, res: Response) => {
  const { roomId, method, wardenId } = req.body;
  const wid = wardenId || 1;
  const [round] = await db.insert(wardenRoundsTable).values({ wardenId: wid, roomId, method }).returning();
  const [warden] = await db.select().from(wardensTable).where(eq(wardensTable.id, round.wardenId)).limit(1);
  const [user] = warden ? await db.select().from(usersTable).where(eq(usersTable.id, warden.userId)).limit(1) : [null];
  const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, round.roomId)).limit(1);
  res.status(201).json({ ...round, wardenName: user?.name ?? "Unknown", roomNumber: room?.roomNumber ?? "N/A" });
});

// Block Surveys
blockSurveyRouter.get("/", async (req: Request, res: Response) => {
  const conditions = [];
  if (req.query.blockId) conditions.push(eq(blockSurveysTable.blockId, Number(req.query.blockId)));
  const surveys = conditions.length ? await db.select().from(blockSurveysTable).where(and(...conditions)) : await db.select().from(blockSurveysTable);
  res.json(surveys);
});

blockSurveyRouter.post("/", async (req: Request, res: Response) => {
  const { blockId, weekStart, safetyScore, cleanlinessScore, comfortScore, studentId } = req.body;
  const overallScore = (safetyScore + cleanlinessScore + comfortScore) / 3;
  const [survey] = await db.insert(blockSurveysTable).values({ blockId, studentId: studentId || 1, weekStart, safetyScore, cleanlinessScore, comfortScore, overallScore }).returning();
  res.status(201).json(survey);
});

// Appointments
appointmentRouter.get("/", async (req: Request, res: Response) => {
  const conditions = [];
  if (req.query.wardenId) conditions.push(eq(appointmentsTable.wardenId, Number(req.query.wardenId)));
  if (req.query.studentId) conditions.push(eq(appointmentsTable.studentId, Number(req.query.studentId)));
  const appointments = conditions.length ? await db.select().from(appointmentsTable).where(and(...conditions)) : await db.select().from(appointmentsTable);
  const enriched = await Promise.all(appointments.map(async a => {
    const [warden] = await db.select().from(wardensTable).where(eq(wardensTable.id, a.wardenId)).limit(1);
    const [wardenUser] = warden ? await db.select().from(usersTable).where(eq(usersTable.id, warden.userId)).limit(1) : [null];
    const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, a.studentId)).limit(1);
    const [studentUser] = student ? await db.select().from(usersTable).where(eq(usersTable.id, student.userId)).limit(1) : [null];
    return { ...a, wardenName: wardenUser?.name ?? "Unknown", studentName: studentUser?.name ?? "Unknown" };
  }));
  res.json(enriched);
});

appointmentRouter.post("/", async (req: Request, res: Response) => {
  const { wardenId, studentId, scheduledAt, type, notes, requestedBy } = req.body;
  const [appt] = await db.insert(appointmentsTable).values({ wardenId, studentId, scheduledAt: new Date(scheduledAt), type, notes, requestedBy: requestedBy || 1 }).returning();
  const [warden] = await db.select().from(wardensTable).where(eq(wardensTable.id, appt.wardenId)).limit(1);
  const [wardenUser] = warden ? await db.select().from(usersTable).where(eq(usersTable.id, warden.userId)).limit(1) : [null];
  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, appt.studentId)).limit(1);
  const [studentUser] = student ? await db.select().from(usersTable).where(eq(usersTable.id, student.userId)).limit(1) : [null];
  res.status(201).json({ ...appt, wardenName: wardenUser?.name ?? "Unknown", studentName: studentUser?.name ?? "Unknown" });
});

appointmentRouter.patch("/:id", async (req: Request, res: Response) => {
  const { status, notes } = req.body;
  const updates: Partial<typeof appointmentsTable.$inferInsert> = { status };
  if (notes) updates.notes = notes;
  const [updated] = await db.update(appointmentsTable).set(updates).where(eq(appointmentsTable.id, Number(req.params.id))).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});
