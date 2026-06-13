import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { staffTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  const staff = await db.select().from(staffTable);
  const enriched = await Promise.all(staff.map(async s => {
    const [u] = await db.select().from(usersTable).where(eq(usersTable.id, s.userId)).limit(1);
    return {
      ...s,
      name: u?.name ?? "Unknown",
      email: u?.email ?? "",
      role: u?.role ?? "gate_staff",
      phone: u?.phone ?? null,
      createdAt: s.createdAt.toISOString(),
    };
  }));
  res.json(enriched);
});

router.post("/", async (req: Request, res: Response) => {
  const { name, email, password, role, department, phone } = req.body;
  const [user] = await db.insert(usersTable).values({ name, email, passwordHash: "hashed_" + password, role: role as "student" | "warden" | "admin" | "parent" | "gate_staff", phone }).returning();
  const [staff] = await db.insert(staffTable).values({ userId: user.id, department }).returning();
  res.status(201).json({ ...staff, name, email, role, phone, createdAt: staff.createdAt.toISOString() });
});

export default router;
