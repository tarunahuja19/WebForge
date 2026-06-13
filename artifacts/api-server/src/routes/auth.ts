import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

// Simple password check (demo mode — no bcrypt needed)
function checkPassword(plain: string, stored: string): boolean {
  return plain === stored || stored === "hashed_" + plain;
}

router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }
  const users = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!users.length) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const user = users[0];
  if (!checkPassword(password, user.passwordHash)) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const { passwordHash: _, ...safeUser } = user;
  res.json({ token: `demo_token_${user.id}`, user: safeUser });
});

router.post("/logout", (_req: Request, res: Response) => {
  res.json({ success: true });
});

router.get("/me", async (req: Request, res: Response) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer demo_token_")) {
    // Return a default admin user for demo
    const users = await db.select().from(usersTable).limit(1);
    if (users.length) {
      const { passwordHash: _, ...safeUser } = users[0];
      res.json(safeUser);
      return;
    }
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = parseInt(auth.replace("Bearer demo_token_", ""));
  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!users.length) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  const { passwordHash: _, ...safeUser } = users[0];
  res.json(safeUser);
});

export default router;
