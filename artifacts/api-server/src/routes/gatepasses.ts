import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { gatePassesTable, studentsTable, usersTable, roomsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

export const gatePassRouter = Router();

type GatePassStatus = "pending" | "approved" | "rejected" | "expired" | "used" | "active";

async function checkAndExpirePass(pass: typeof gatePassesTable.$inferSelect): Promise<typeof gatePassesTable.$inferSelect> {
  if (pass.status === "active" && pass.activatedAt) {
    const twoHoursMs = 2 * 60 * 60 * 1000;
    const elapsed = Date.now() - new Date(pass.activatedAt).getTime();
    if (elapsed >= twoHoursMs) {
      const [updated] = await db
        .update(gatePassesTable)
        .set({ status: "expired" })
        .where(eq(gatePassesTable.id, pass.id))
        .returning();
      return updated ?? pass;
    }
  }
  return pass;
}

async function enrichGatePass(pass: typeof gatePassesTable.$inferSelect) {
  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, pass.studentId)).limit(1);
  const [user] = student
    ? await db.select().from(usersTable).where(eq(usersTable.id, student.userId)).limit(1)
    : [null];
  const [room] = student?.roomId
    ? await db.select().from(roomsTable).where(eq(roomsTable.id, student.roomId)).limit(1)
    : [null];

  return {
    ...pass,
    studentName: user?.name ?? "Unknown",
    studentRoll: student?.rollNumber ?? null,
    studentRoom: room?.roomNumber ?? null,
    studentDept: student?.department ?? null,
  };
}

gatePassRouter.get("/", async (req: Request, res: Response) => {
  const conditions = [];
  if (req.query.studentId) conditions.push(eq(gatePassesTable.studentId, Number(req.query.studentId)));
  if (req.query.status) conditions.push(eq(gatePassesTable.status, req.query.status as GatePassStatus));
  const passes = conditions.length
    ? await db.select().from(gatePassesTable).where(and(...conditions))
    : await db.select().from(gatePassesTable);

  const enriched = await Promise.all(
    passes.map(async (p) => {
      const checked = await checkAndExpirePass(p);
      return enrichGatePass(checked);
    })
  );
  res.json(enriched);
});

gatePassRouter.post("/", async (req: Request, res: Response) => {
  const { destination, purpose, expectedReturn, studentId } = req.body;
  const sid = studentId || 1;
  const qrCode = `HOSTEL_PASS_${Date.now()}_${sid}`;
  const [pass] = await db
    .insert(gatePassesTable)
    .values({ studentId: sid, destination, purpose, expectedReturn: new Date(expectedReturn), qrCode })
    .returning();
  res.status(201).json(await enrichGatePass(pass));
});

gatePassRouter.get("/:id", async (req: Request, res: Response) => {
  const [pass] = await db
    .select()
    .from(gatePassesTable)
    .where(eq(gatePassesTable.id, Number(req.params.id)))
    .limit(1);
  if (!pass) { res.status(404).json({ error: "Not found" }); return; }
  const checked = await checkAndExpirePass(pass);
  res.json(await enrichGatePass(checked));
});

gatePassRouter.patch("/:id", async (req: Request, res: Response) => {
  const { status, wardenRemarks } = req.body;
  const updates: Partial<typeof gatePassesTable.$inferInsert> = { status };
  if (wardenRemarks) updates.wardenRemarks = wardenRemarks;
  if (status === "approved") updates.approvedAt = new Date();
  if (status === "active") updates.activatedAt = new Date();
  const [updated] = await db
    .update(gatePassesTable)
    .set(updates)
    .where(eq(gatePassesTable.id, Number(req.params.id)))
    .returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await enrichGatePass(updated));
});
