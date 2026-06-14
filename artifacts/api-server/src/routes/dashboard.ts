import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import {
  studentsTable, blocksTable, roomsTable, gatePassesTable, gateLogsTable,
  leaveRequestsTable, complaintsTable, messAttendanceTable, feeRecordsTable,
  visitorRequestsTable, announcementsTable, usersTable, wardensTable
} from "@workspace/db";
import { eq, count } from "drizzle-orm";

async function checkAndExpirePassDash(pass: typeof gatePassesTable.$inferSelect): Promise<typeof gatePassesTable.$inferSelect> {
  if (pass.status === "active" && pass.activatedAt) {
    const twoHoursMs = 2 * 60 * 60 * 1000;
    const elapsed = Date.now() - new Date(pass.activatedAt).getTime();
    if (elapsed >= twoHoursMs) {
      const [updated] = await db.update(gatePassesTable).set({ status: "expired" }).where(eq(gatePassesTable.id, pass.id)).returning();
      return updated ?? pass;
    }
  }
  return pass;
}

async function enrichGatePassDash(pass: typeof gatePassesTable.$inferSelect) {
  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, pass.studentId)).limit(1);
  const [user] = student ? await db.select().from(usersTable).where(eq(usersTable.id, student.userId)).limit(1) : [null];
  const [room] = student?.roomId ? await db.select().from(roomsTable).where(eq(roomsTable.id, student.roomId)).limit(1) : [null];
  return { ...pass, studentName: user?.name ?? "Unknown", studentRoll: student?.rollNumber ?? null, studentRoom: room?.roomNumber ?? null, studentDept: student?.department ?? null };
}

const router = Router();

router.get("/student-summary", async (req: Request, res: Response) => {
  const studentId = Number(req.query.studentId) || 1;
  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, studentId)).limit(1);
  const [user] = student ? await db.select().from(usersTable).where(eq(usersTable.id, student.userId)).limit(1) : [null];
  const passes = await db.select().from(gatePassesTable).where(eq(gatePassesTable.studentId, studentId));
  const complaints = await db.select().from(complaintsTable).where(eq(complaintsTable.studentId, studentId));
  const fees = await db.select().from(feeRecordsTable).where(eq(feeRecordsTable.studentId, studentId));
  const messThisWeek = await db.select().from(messAttendanceTable).where(eq(messAttendanceTable.studentId, studentId));
  const latestFee = fees[fees.length - 1];

  // Enrich & expire-check active/approved passes for the student dashboard card
  const relevantPasses = passes.filter(p => p.status === "approved" || p.status === "active");
  const activeGatePasses = await Promise.all(
    relevantPasses.map(async (p) => {
      const checked = await checkAndExpirePassDash(p);
      return enrichGatePassDash(checked);
    })
  );

  const recentActivity: any[] = [];
  passes.slice(-3).forEach(p => {
    recentActivity.push({
      id: `gp-${p.id}`,
      type: "gate_pass",
      description: `Gate pass to ${p.destination} (${p.status})`,
      timestamp: new Date(p.createdAt || Date.now()).toISOString(),
      icon: "door"
    });
  });
  complaints.slice(-3).forEach(c => {
    recentActivity.push({
      id: `c-${c.id}`,
      type: "complaint",
      description: `Complaint: ${c.description} (${c.status})`,
      timestamp: new Date(c.createdAt || Date.now()).toISOString(),
      icon: "wrench"
    });
  });
  messThisWeek.slice(-3).forEach(m => {
    recentActivity.push({
      id: `m-${m.id}`,
      type: "mess",
      description: `Tapped in for ${m.mealType}`,
      timestamp: new Date(m.tapInTime || Date.now()).toISOString(),
      icon: "utensils"
    });
  });
  recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  res.json({
    student: { ...student, name: user?.name ?? "Student", email: user?.email ?? "", avatar: user?.avatar ?? null, phone: user?.phone ?? null, roomNumber: null, blockName: null, feeStatus: latestFee?.status ?? "pending" },
    recentActivity: recentActivity.slice(0, 5),
    pendingActions: passes.filter(p => p.status === "pending").length > 0 ? ["Gate pass pending approval"] : [],
    messAttendanceThisWeek: messThisWeek.length,
    activePasses: activeGatePasses.length,
    activeGatePasses,
    pendingComplaints: complaints.filter(c => c.status !== "resolved").length,
    currentMonthFeeStatus: latestFee?.status ?? "pending",
    upcomingLeave: null,
  });
});

router.get("/warden-summary", async (_req: Request, res: Response) => {
  const students = await db.select().from(studentsTable);
  const complaints = await db.select().from(complaintsTable);
  const passes = await db.select().from(gatePassesTable);
  const visitors = await db.select().from(visitorRequestsTable);
  res.json({
    blockId: 1,
    blockName: "Block A",
    totalStudents: students.length,
    pendingApprovals: passes.filter(p => p.status === "pending").length,
    atRiskCount: students.filter(s => (s.wellbeingScore ?? 80) < 70).length,
    activeComplaints: complaints.filter(c => c.status !== "resolved").length,
    overdueComplaints: complaints.filter(c => c.isOverdue).length,
    todayMessCount: Math.floor(students.length * 0.7),
    pendingVisitors: visitors.filter(v => v.status === "pending").length,
    blockSentimentScore: 3.9,
    recentActivity: [
      { id: 1, type: "complaint", description: "New electrical complaint from Room 204", timestamp: new Date(Date.now() - 1800000).toISOString(), icon: "zap" },
      { id: 2, type: "gate_pass", description: "Gate pass approved for Arjun Kumar", timestamp: new Date(Date.now() - 3600000).toISOString(), icon: "door" },
      { id: 3, type: "alert", description: "Student showing low wellbeing signals", timestamp: new Date(Date.now() - 7200000).toISOString(), icon: "alert" },
    ],
  });
});

router.get("/admin-summary", async (_req: Request, res: Response) => {
  const students = await db.select().from(studentsTable);
  const blocks = await db.select().from(blocksTable);
  const rooms = await db.select().from(roomsTable);
  const complaints = await db.select().from(complaintsTable);
  const fees = await db.select().from(feeRecordsTable);
  const occupiedRooms = rooms.filter(r => r.status === "full").length;
  const occupancyRate = rooms.length > 0 ? (occupiedRooms / rooms.length) * 100 : 0;
  const paidFees = fees.filter(f => f.status === "paid");
  const totalExpected = fees.reduce((s, f) => s + Number(f.totalAmount), 0);
  const totalCollected = paidFees.reduce((s, f) => s + Number(f.totalAmount), 0);
  res.json({
    totalStudents: students.length,
    totalBlocks: blocks.length,
    totalRooms: rooms.length,
    occupancyRate,
    feeCollectionRate: totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0,
    pendingFees: totalExpected - totalCollected,
    activeComplaints: complaints.filter(c => c.status !== "resolved").length,
    resolvedComplaintsThisMonth: complaints.filter(c => c.status === "resolved").length,
    blockHealthScores: blocks.map(b => ({
      blockId: b.id,
      overall: 70 + Math.floor(Math.random() * 20),
      complaintResolution: 75 + Math.floor(Math.random() * 20),
      wardenCompliance: 80 + Math.floor(Math.random() * 15),
      feeCollection: 70 + Math.floor(Math.random() * 25),
      messParticipation: 65 + Math.floor(Math.random() * 30),
      maintenanceSla: 72 + Math.floor(Math.random() * 20),
      trend: "stable",
    })),
    recentActivity: [
      { id: 1, type: "fee", description: "Fee collection target 78% achieved for Block B", timestamp: new Date(Date.now() - 3600000).toISOString(), icon: "rupee" },
      { id: 2, type: "complaint", description: "Block C maintenance SLA breached", timestamp: new Date(Date.now() - 7200000).toISOString(), icon: "alert" },
      { id: 3, type: "student", description: "New student Priya Sharma allocated to Block A", timestamp: new Date(Date.now() - 10800000).toISOString(), icon: "user" },
    ],
  });
});

router.get("/parent-summary", async (req: Request, res: Response) => {
  const studentId = Number(req.query.studentId) || 1;
  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, studentId)).limit(1);
  const [user] = student ? await db.select().from(usersTable).where(eq(usersTable.id, student.userId)).limit(1) : [null];
  const fees = await db.select().from(feeRecordsTable).where(eq(feeRecordsTable.studentId, studentId));
  const leaves = await db.select().from(leaveRequestsTable).where(eq(leaveRequestsTable.studentId, studentId));
  const visitors = await db.select().from(visitorRequestsTable).where(eq(visitorRequestsTable.studentId, studentId));
  const mess = await db.select().from(messAttendanceTable).where(eq(messAttendanceTable.studentId, studentId));
  const latestFee = fees[fees.length - 1];
  const enrichedLeaves = leaves.map(l => ({ ...l, studentName: user?.name ?? "Student" }));
  const enrichedVisitors = visitors.map(v => ({ ...v, studentName: user?.name ?? "Student" }));
  res.json({
    student: { ...student, name: user?.name ?? "Student", email: user?.email ?? "", avatar: user?.avatar ?? null, phone: user?.phone ?? null, roomNumber: null, blockName: null, feeStatus: latestFee?.status ?? "pending" },
    feeStatus: latestFee?.status ?? "pending",
    currentFeeAmount: Number(latestFee?.totalAmount ?? 0),
    recentLeaves: enrichedLeaves.slice(-3),
    visitorLog: enrichedVisitors.slice(-5),
    messAttendancePercent: mess.length > 0 ? Math.min(100, (mess.length / 21) * 100) : 0,
    gateActivityCount: 12,
    lastSeen: new Date(Date.now() - 3600000 * 2).toISOString(),
  });
});

router.get("/gate-summary", async (_req: Request, res: Response) => {
  const today = new Date().toISOString().split("T")[0];
  const logs = await db.select().from(gateLogsTable);
  const passes = await db.select().from(gatePassesTable);
  const todayLogs = logs.filter(l => new Date(l.timestamp).toISOString().startsWith(today));
  const entries = todayLogs.filter(l => l.type === "entry");
  const exits = todayLogs.filter(l => l.type === "exit");
  const tailgating = todayLogs.filter(l => l.isTailgating);
  const enrichedLogs = await Promise.all(todayLogs.slice(-10).map(async l => {
    const [s] = await db.select().from(studentsTable).where(eq(studentsTable.id, l.studentId)).limit(1);
    const [u] = s ? await db.select().from(usersTable).where(eq(usersTable.id, s.userId)).limit(1) : [null];
    return { ...l, studentName: u?.name ?? "Unknown" };
  }));
  res.json({
    todayEntries: entries.length,
    todayExits: exits.length,
    currentlyOut: Math.max(0, exits.length - entries.length + 5),
    pendingVerifications: passes.filter(p => p.status === "pending").length,
    tailgatingAlerts: tailgating.length,
    recentLogs: enrichedLogs,
    activePasses: passes.filter(p => p.status === "approved" || p.status === "active").length,
  });
});

router.get("/occupancy-stats", async (_req: Request, res: Response) => {
  const rooms = await db.select().from(roomsTable);
  const blocks = await db.select().from(blocksTable);
  const total = rooms.length;
  const occupied = rooms.filter(r => r.status === "full").length;
  const available = rooms.filter(r => r.status === "available").length;
  const blockStats = await Promise.all(blocks.map(async b => {
    const blockRooms = rooms.filter(r => r.blockId === b.id);
    const blockOccupied = blockRooms.filter(r => r.status === "full").length;
    return {
      blockId: b.id,
      blockName: b.name,
      occupancyRate: blockRooms.length > 0 ? (blockOccupied / blockRooms.length) * 100 : 0,
      total: blockRooms.length,
      occupied: blockOccupied,
    };
  }));
  res.json({ total, occupied, available, occupancyRate: total > 0 ? (occupied / total) * 100 : 0, byBlock: blockStats });
});

router.get("/complaint-stats", async (_req: Request, res: Response) => {
  const complaints = await db.select().from(complaintsTable);
  const byCategory = ["plumbing", "electrical", "furniture", "hygiene", "other"].map(cat => ({
    category: cat,
    count: complaints.filter(c => c.category === cat).length,
  }));
  const resolved = complaints.filter(c => c.status === "resolved");
  res.json({
    total: complaints.length,
    byStatus: {
      raised: complaints.filter(c => c.status === "raised").length,
      acknowledged: complaints.filter(c => c.status === "acknowledged").length,
      in_progress: complaints.filter(c => c.status === "in_progress").length,
      resolved: resolved.length,
    },
    byCategory,
    avgResolutionHours: 28,
    overdueCount: complaints.filter(c => c.isOverdue).length,
  });
});

router.get("/fee-stats", async (_req: Request, res: Response) => {
  const fees = await db.select().from(feeRecordsTable);
  const totalExpected = fees.reduce((s, f) => s + Number(f.totalAmount), 0);
  const totalCollected = fees.filter(f => f.status === "paid").reduce((s, f) => s + Number(f.totalAmount), 0);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const monthlyTrend = months.map(month => ({
    month,
    collected: 45000 + Math.random() * 20000,
    expected: 65000,
  }));
  res.json({
    totalExpected,
    totalCollected,
    collectionRate: totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0,
    pendingAmount: totalExpected - totalCollected,
    overdueCount: fees.filter(f => f.status === "overdue").length,
    monthlyTrend,
  });
});

export default router;
