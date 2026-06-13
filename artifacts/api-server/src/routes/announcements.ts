import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { announcementsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const announcements = await db.select().from(announcementsTable);
  const enriched = await Promise.all(announcements.map(async a => {
    const [u] = await db.select().from(usersTable).where(eq(usersTable.id, a.createdById)).limit(1);
    return { ...a, createdByName: u?.name ?? "Admin" };
  }));
  const targetRole = req.query.targetRole as string;
  if (targetRole) {
    res.json(enriched.filter(a => a.targetRole === "all" || a.targetRole === targetRole));
    return;
  }
  res.json(enriched);
});

router.post("/", async (req: Request, res: Response) => {
  const { title, content, targetRole, priority, createdById } = req.body;
  const [ann] = await db.insert(announcementsTable).values({ title, content, targetRole: targetRole || "all", priority: priority || "normal", createdById: createdById || 1 }).returning();
  const [u] = await db.select().from(usersTable).where(eq(usersTable.id, ann.createdById)).limit(1);
  res.status(201).json({ ...ann, createdByName: u?.name ?? "Admin" });
});

export default router;
