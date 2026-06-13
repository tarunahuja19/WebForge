import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { messAttendanceTable, messMenusTable, menuVotesTable, studentsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/attendance", async (req: Request, res: Response) => {
  const conditions = [];
  if (req.query.studentId) conditions.push(eq(messAttendanceTable.studentId, Number(req.query.studentId)));
  if (req.query.date) conditions.push(eq(messAttendanceTable.date, req.query.date as string));
  if (req.query.mealType) conditions.push(eq(messAttendanceTable.mealType, req.query.mealType as "breakfast" | "lunch" | "dinner"));
  const records = conditions.length ? await db.select().from(messAttendanceTable).where(and(...conditions)) : await db.select().from(messAttendanceTable);
  const enriched = await Promise.all(records.map(async r => {
    const [s] = await db.select().from(studentsTable).where(eq(studentsTable.id, r.studentId)).limit(1);
    const [u] = s ? await db.select().from(usersTable).where(eq(usersTable.id, s.userId)).limit(1) : [null];
    return { ...r, studentName: u?.name ?? "Unknown" };
  }));
  res.json(enriched);
});

router.post("/attendance", async (req: Request, res: Response) => {
  const { studentId, mealType, date, method } = req.body;
  const [record] = await db.insert(messAttendanceTable).values({ studentId, mealType, date, method }).returning();
  const [s] = await db.select().from(studentsTable).where(eq(studentsTable.id, record.studentId)).limit(1);
  const [u] = s ? await db.select().from(usersTable).where(eq(usersTable.id, s.userId)).limit(1) : [null];
  res.status(201).json({ ...record, studentName: u?.name ?? "Unknown" });
});

router.get("/menu", async (req: Request, res: Response) => {
  const conditions = [];
  if (req.query.weekStart) conditions.push(eq(messMenusTable.weekStart, req.query.weekStart as string));
  const menus = conditions.length ? await db.select().from(messMenusTable).where(and(...conditions)) : await db.select().from(messMenusTable);
  res.json(menus);
});

router.post("/menu", async (req: Request, res: Response) => {
  const [menu] = await db.insert(messMenusTable).values({ weekStart: req.body.weekStart, items: req.body.items }).returning();
  res.status(201).json(menu);
});

router.get("/votes", async (req: Request, res: Response) => {
  const conditions = [];
  if (req.query.weekStart) conditions.push(eq(menuVotesTable.weekStart, req.query.weekStart as string));
  const votes = conditions.length ? await db.select().from(menuVotesTable).where(and(...conditions)) : await db.select().from(menuVotesTable);
  res.json(votes);
});

router.post("/votes", async (req: Request, res: Response) => {
  const { weekStart, menuItemId, preference, studentId } = req.body;
  const sid = studentId || 1;
  const [vote] = await db.insert(menuVotesTable).values({ studentId: sid, weekStart, menuItemId, preference }).returning();
  res.status(201).json(vote);
});

router.get("/headcount", async (_req: Request, res: Response) => {
  const today = new Date().toISOString().split("T")[0];
  const todayRecords = await db.select().from(messAttendanceTable).where(eq(messAttendanceTable.date, today));
  const breakfastCount = todayRecords.filter(r => r.mealType === "breakfast").length;
  const lunchCount = todayRecords.filter(r => r.mealType === "lunch").length;
  const dinnerCount = todayRecords.filter(r => r.mealType === "dinner").length;
  res.json({
    currentCount: lunchCount,
    breakfastCount,
    lunchCount,
    dinnerCount,
    predictedNext30Min: Math.floor(lunchCount * 1.3),
    timestamp: new Date().toISOString(),
  });
});

router.post("/predict", async (req: Request, res: Response) => {
  try {
    const { date, meal, menu, examWeek, festival, holidayNear, rain } = req.body;
    
    // Call FastAPI endpoint
    const response = await fetch("http://127.0.0.1:8000/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        date,
        meal,
        menu,
        examWeek,
        festival,
        holidayNear,
        rain,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      res.status(response.status).json({ error: `FastAPI error: ${errorText}` });
      return;
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("Error predicting waste:", error);
    res.status(500).json({ error: error.message || "Failed to predict waste" });
  }
});

export default router;
