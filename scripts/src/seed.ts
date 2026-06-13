import { db } from "@workspace/db";
import {
  usersTable, blocksTable, roomsTable, studentsTable, wardensTable,
  roomAllocationsTable, gatePassesTable, gateLogsTable, leaveRequestsTable,
  complaintsTable, complaintMessagesTable, messAttendanceTable, messMenusTable,
  feeRecordsTable, visitorRequestsTable, announcementsTable, wardenRoundsTable,
  blockSurveysTable, appointmentsTable, staffTable
} from "@workspace/db";

async function seed() {
  console.log("Seeding database...");

  // Clear existing data
  await db.delete(appointmentsTable);
  await db.delete(blockSurveysTable);
  await db.delete(wardenRoundsTable);
  await db.delete(announcementsTable);
  await db.delete(visitorRequestsTable);
  await db.delete(feeRecordsTable);
  await db.delete(messAttendanceTable);
  await db.delete(messMenusTable);
  await db.delete(complaintMessagesTable);
  await db.delete(complaintsTable);
  await db.delete(leaveRequestsTable);
  await db.delete(gateLogsTable);
  await db.delete(gatePassesTable);
  await db.delete(roomAllocationsTable);
  await db.delete(staffTable);
  await db.delete(studentsTable);
  await db.delete(wardensTable);
  await db.delete(roomsTable);
  await db.delete(blocksTable);
  await db.delete(usersTable);

  console.log("Cleared existing data.");

  // Create users
  const [adminUser] = await db.insert(usersTable).values({
    name: "Dr. Rajesh Sharma", email: "admin@hostel.edu",
    passwordHash: "hashed_admin123", role: "admin", phone: "9876543210"
  }).returning();

  const [warden1User] = await db.insert(usersTable).values({
    name: "Prof. Meena Patel", email: "warden1@hostel.edu",
    passwordHash: "hashed_warden123", role: "warden", phone: "9876543211"
  }).returning();

  const [warden2User] = await db.insert(usersTable).values({
    name: "Prof. Suresh Kumar", email: "warden2@hostel.edu",
    passwordHash: "hashed_warden123", role: "warden", phone: "9876543212"
  }).returning();

  const [gateUser] = await db.insert(usersTable).values({
    name: "Ramesh Yadav", email: "gate@hostel.edu",
    passwordHash: "hashed_gate123", role: "gate_staff", phone: "9876543213"
  }).returning();

  const studentUsers = await db.insert(usersTable).values([
    { name: "Arjun Sharma", email: "arjun@student.edu", passwordHash: "hashed_student123", role: "student", phone: "8765432101" },
    { name: "Priya Singh", email: "priya@student.edu", passwordHash: "hashed_student123", role: "student", phone: "8765432102" },
    { name: "Rohit Verma", email: "rohit@student.edu", passwordHash: "hashed_student123", role: "student", phone: "8765432103" },
    { name: "Aisha Khan", email: "aisha@student.edu", passwordHash: "hashed_student123", role: "student", phone: "8765432104" },
    { name: "Vikram Nair", email: "vikram@student.edu", passwordHash: "hashed_student123", role: "student", phone: "8765432105" },
    { name: "Sneha Reddy", email: "sneha@student.edu", passwordHash: "hashed_student123", role: "student", phone: "8765432106" },
    { name: "Kartik Joshi", email: "kartik@student.edu", passwordHash: "hashed_student123", role: "student", phone: "8765432107" },
    { name: "Divya Iyer", email: "divya@student.edu", passwordHash: "hashed_student123", role: "student", phone: "8765432108" },
  ]).returning();

  const parentUsers = await db.insert(usersTable).values([
    { name: "Suresh Sharma", email: "parent1@hostel.edu", passwordHash: "hashed_parent123", role: "parent", phone: "7654321011" },
    { name: "Geeta Singh", email: "parent2@hostel.edu", passwordHash: "hashed_parent123", role: "parent", phone: "7654321012" },
  ]).returning();

  console.log("Created users.");

  // Create blocks
  const [blockA] = await db.insert(blocksTable).values({ name: "Block A (Boys)" }).returning();
  const [blockB] = await db.insert(blocksTable).values({ name: "Block B (Boys)" }).returning();
  const [blockC] = await db.insert(blocksTable).values({ name: "Block C (Girls)" }).returning();

  console.log("Created blocks.");

  // Create wardens
  const [warden1] = await db.insert(wardensTable).values({ userId: warden1User.id, blockId: blockA.id }).returning();
  const [warden2] = await db.insert(wardensTable).values({ userId: warden2User.id, blockId: blockC.id }).returning();

  // Update blocks with warden
  await db.update(blocksTable).set({ wardenId: warden1.id }).where((db as any).eq?.(blocksTable.id, blockA.id));

  // Create rooms
  const rooms = await db.insert(roomsTable).values([
    { roomNumber: "A101", blockId: blockA.id, floor: 1, capacity: 2, status: "full" },
    { roomNumber: "A102", blockId: blockA.id, floor: 1, capacity: 2, status: "full" },
    { roomNumber: "A103", blockId: blockA.id, floor: 1, capacity: 2, status: "available" },
    { roomNumber: "A201", blockId: blockA.id, floor: 2, capacity: 3, status: "full" },
    { roomNumber: "A202", blockId: blockA.id, floor: 2, capacity: 3, status: "available" },
    { roomNumber: "B101", blockId: blockB.id, floor: 1, capacity: 2, status: "full" },
    { roomNumber: "B102", blockId: blockB.id, floor: 1, capacity: 2, status: "maintenance" },
    { roomNumber: "C101", blockId: blockC.id, floor: 1, capacity: 2, status: "full" },
    { roomNumber: "C102", blockId: blockC.id, floor: 1, capacity: 2, status: "full" },
  ]).returning();

  console.log("Created rooms.");

  // Create students
  const students = await db.insert(studentsTable).values([
    { userId: studentUsers[0].id, rollNumber: "CS21001", year: 3, department: "Computer Science", roomId: rooms[0].id, blockId: blockA.id, emergencyContact: "9900001111", parentEmail: parentUsers[0].email, wellbeingScore: 85 },
    { userId: studentUsers[1].id, rollNumber: "EC21002", year: 2, department: "Electronics", roomId: rooms[1].id, blockId: blockA.id, emergencyContact: "9900002222", parentEmail: parentUsers[1].email, wellbeingScore: 72 },
    { userId: studentUsers[2].id, rollNumber: "ME21003", year: 3, department: "Mechanical", roomId: rooms[1].id, blockId: blockA.id, emergencyContact: "9900003333", wellbeingScore: 65 },
    { userId: studentUsers[3].id, rollNumber: "CE21004", year: 1, department: "Civil", roomId: rooms[7].id, blockId: blockC.id, emergencyContact: "9900004444", wellbeingScore: 90 },
    { userId: studentUsers[4].id, rollNumber: "CS21005", year: 4, department: "Computer Science", roomId: rooms[3].id, blockId: blockA.id, emergencyContact: "9900005555", wellbeingScore: 55 },
    { userId: studentUsers[5].id, rollNumber: "EC21006", year: 2, department: "Electronics", roomId: rooms[8].id, blockId: blockC.id, emergencyContact: "9900006666", wellbeingScore: 88 },
    { userId: studentUsers[6].id, rollNumber: "MA21007", year: 3, department: "Mathematics", roomId: rooms[5].id, blockId: blockB.id, emergencyContact: "9900007777", wellbeingScore: 78 },
    { userId: studentUsers[7].id, rollNumber: "PH21008", year: 2, department: "Physics", roomId: rooms[0].id, blockId: blockA.id, emergencyContact: "9900008888", wellbeingScore: 82 },
  ]).returning();

  console.log("Created students.");

  // Create room allocations
  for (const student of students) {
    if (student.roomId) {
      await db.insert(roomAllocationsTable).values({ studentId: student.id, roomId: student.roomId });
    }
  }

  // Create gate passes
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 86400000);
  const yesterday = new Date(now.getTime() - 86400000);

  await db.insert(gatePassesTable).values([
    { studentId: students[0].id, destination: "Home - Delhi", purpose: "Family visit - sister's wedding", expectedReturn: tomorrow, status: "approved", qrCode: `HOSTEL_PASS_001`, wardenRemarks: "Approved. Return by 8 PM.", approvedAt: new Date() },
    { studentId: students[1].id, destination: "City Mall", purpose: "Shopping for lab supplies", expectedReturn: new Date(now.getTime() + 7200000), status: "pending", qrCode: `HOSTEL_PASS_002` },
    { studentId: students[2].id, destination: "Hospital", purpose: "Medical appointment", expectedReturn: new Date(now.getTime() + 10800000), status: "rejected", qrCode: `HOSTEL_PASS_003`, wardenRemarks: "Please provide medical certificate" },
    { studentId: students[3].id, destination: "Library - Main Campus", purpose: "Project research", expectedReturn: new Date(now.getTime() + 5400000), status: "approved", qrCode: `HOSTEL_PASS_004`, approvedAt: new Date(now.getTime() - 3600000) },
    { studentId: students[4].id, destination: "Bus Stand", purpose: "Going to temple", expectedReturn: new Date(now.getTime() + 14400000), status: "pending", qrCode: `HOSTEL_PASS_005` },
  ]);

  // Create gate logs
  await db.insert(gateLogsTable).values([
    { studentId: students[0].id, type: "exit", method: "qr", isTailgating: false },
    { studentId: students[3].id, type: "exit", method: "qr", isTailgating: false },
    { studentId: students[6].id, type: "exit", method: "manual", isTailgating: false },
    { studentId: students[6].id, type: "entry", method: "manual", isTailgating: false },
    { studentId: students[1].id, type: "exit", method: "face", isTailgating: false },
    { studentId: students[2].id, type: "entry", method: "manual", isTailgating: true },
  ]);

  console.log("Created gate data.");

  // Create leave requests
  const nextWeek = new Date(now.getTime() + 7 * 86400000).toISOString().split("T")[0];
  const nextWeekEnd = new Date(now.getTime() + 10 * 86400000).toISOString().split("T")[0];
  const lastWeek = new Date(now.getTime() - 7 * 86400000).toISOString().split("T")[0];
  const lastWeekEnd = new Date(now.getTime() - 4 * 86400000).toISOString().split("T")[0];
  const today = now.toISOString().split("T")[0];
  const todayPlus3 = new Date(now.getTime() + 3 * 86400000).toISOString().split("T")[0];

  await db.insert(leaveRequestsTable).values([
    { studentId: students[0].id, fromDate: nextWeek, toDate: nextWeekEnd, destination: "Home - Delhi", reason: "Sister's wedding ceremony", emergencyContact: "9900001111", status: "warden_approved", wardenRemarks: "Approved. Safe journey." },
    { studentId: students[1].id, fromDate: today, toDate: todayPlus3, destination: "Home - Mumbai", reason: "Medical check-up and rest", emergencyContact: "9900002222", status: "pending" },
    { studentId: students[4].id, fromDate: lastWeek, toDate: lastWeekEnd, destination: "Home - Bangalore", reason: "Family function", emergencyContact: "9900005555", status: "admin_approved", wardenRemarks: "Approved", adminRemarks: "Final approval granted" },
    { studentId: students[2].id, fromDate: nextWeek, toDate: nextWeekEnd, destination: "Home - Pune", reason: "Diwali holidays", emergencyContact: "9900003333", status: "rejected", wardenRemarks: "Exams scheduled, cannot grant leave" },
  ]);

  console.log("Created leave requests.");

  // Create complaints
  const comp = await db.insert(complaintsTable).values([
    { studentId: students[0].id, category: "plumbing", description: "Water tap in bathroom is leaking continuously, causing water wastage and floor wetness.", roomNumber: "A101", blockId: blockA.id, status: "in_progress", priority: "high", slaHours: 24, assignedTo: "Plumbing Team" },
    { studentId: students[1].id, category: "electrical", description: "Power socket near study table not working. Unable to charge laptop.", roomNumber: "A102", blockId: blockA.id, status: "acknowledged", priority: "medium", slaHours: 48 },
    { studentId: students[2].id, category: "furniture", description: "Study chair leg is broken, dangerous to sit on.", roomNumber: "A102", blockId: blockA.id, status: "raised", priority: "medium", slaHours: 72 },
    { studentId: students[3].id, category: "hygiene", description: "Common corridor near room C101 not cleaned for 3 days.", roomNumber: "C101", blockId: blockC.id, status: "resolved", priority: "low", slaHours: 48, resolvedAt: new Date(now.getTime() - 86400000), assignedTo: "Housekeeping" },
    { studentId: students[4].id, category: "electrical", description: "Common room TV remote not working, channels keep changing.", roomNumber: "A201", blockId: blockA.id, status: "raised", priority: "low", slaHours: 96, isOverdue: true },
    { studentId: students[6].id, category: "plumbing", description: "Water heater not working in Block B bathroom 1.", roomNumber: "B101", blockId: blockB.id, status: "in_progress", priority: "high", slaHours: 24, assignedTo: "Maintenance" },
  ]).returning();

  // Add complaint messages
  await db.insert(complaintMessagesTable).values([
    { complaintId: comp[0].id, senderId: students[0].userId, senderRole: "student", message: "The leak has gotten worse, please send someone urgently." },
    { complaintId: comp[0].id, senderId: warden1User.id, senderRole: "warden", message: "Acknowledged. Plumbing team has been notified, they will visit today between 3-5 PM." },
    { complaintId: comp[0].id, senderId: students[0].userId, senderRole: "student", message: "Thank you, will be available." },
    { complaintId: comp[1].id, senderId: warden1User.id, senderRole: "warden", message: "We have raised a work order with the electrician. Expected resolution in 24 hours." },
  ]);

  console.log("Created complaints.");

  // Create mess menu
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
  const weekStartStr = weekStart.toISOString().split("T")[0];

  await db.insert(messMenusTable).values([{
    weekStart: weekStartStr,
    isPublished: true,
    items: [
      { day: "Monday", breakfast: "Idli, Sambar, Coconut Chutney, Tea", lunch: "Dal Makhani, Jeera Rice, Sabzi, Roti, Salad", dinner: "Paneer Butter Masala, Naan, Rice, Raita" },
      { day: "Tuesday", breakfast: "Poha, Jalebi, Tea", lunch: "Rajma, Rice, Chapati, Mixed Veg, Curd", dinner: "Aloo Gobi, Roti, Dal Tadka, Rice" },
      { day: "Wednesday", breakfast: "Paratha, Pickle, Curd, Tea", lunch: "Chole Bhature, Raita, Salad", dinner: "Egg Curry / Paneer Curry, Roti, Rice, Raita" },
      { day: "Thursday", breakfast: "Upma, Chutney, Tea", lunch: "Kadhi Pakoda, Rice, Roti, Aloo Sabzi, Salad", dinner: "Mixed Dal, Roti, Jeera Rice, Papad" },
      { day: "Friday", breakfast: "Bread Butter, Cornflakes, Milk, Tea", lunch: "Biryani (Veg/Egg), Raita, Salan, Mirchi ka Salan", dinner: "Dal Fry, Roti, Rice, Sabzi" },
      { day: "Saturday", breakfast: "Puri Bhaji, Tea", lunch: "Chowmein, Manchurian, Soup", dinner: "Special: Palak Paneer, Naan, Pulao, Kheer" },
      { day: "Sunday", breakfast: "Dosa, Sambhar, Chutney, Tea, Juice", lunch: "Special Sunday Thali: Paneer, Dal, Rice, Roti, Salad, Sweet", dinner: "Fried Rice, Chowmein, Soup, Ice Cream" },
    ]
  }]);

  // Create mess attendance (last 2 weeks)
  const mealTypes: ("breakfast" | "lunch" | "dinner")[] = ["breakfast", "lunch", "dinner"];
  for (let dayOffset = 13; dayOffset >= 0; dayOffset--) {
    const date = new Date(now.getTime() - dayOffset * 86400000).toISOString().split("T")[0];
    for (const student of students.slice(0, 6)) {
      for (const mealType of mealTypes) {
        if (Math.random() > 0.25) {
          await db.insert(messAttendanceTable).values({ studentId: student.id, mealType, date, method: "qr" });
        }
      }
    }
  }

  console.log("Created mess data.");

  // Create fee records
  const months = ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06"];
  for (const student of students) {
    for (const month of months) {
      const dueDate = `${month}-15`;
      const isCurrentMonth = month === "2026-06";
      const status = isCurrentMonth ? (Math.random() > 0.5 ? "pending" : "paid") : (Math.random() > 0.2 ? "paid" : "overdue");
      const hostelFee = 5500;
      const messFee = 3200;
      const electricityFee = 800;
      const total = hostelFee + messFee + electricityFee;
      await db.insert(feeRecordsTable).values({
        studentId: student.id, month, hostelFee: hostelFee.toString(), messFee: messFee.toString(),
        electricityFee: electricityFee.toString(), penaltyAmount: "0", totalAmount: total.toString(),
        paidAmount: status === "paid" ? total.toString() : "0",
        status, dueDate, paidAt: status === "paid" ? new Date(`${month}-10`) : null,
      });
    }
  }

  console.log("Created fee records.");

  // Create visitor requests
  await db.insert(visitorRequestsTable).values([
    { studentId: students[0].id, visitorName: "Mr. Suresh Sharma", relation: "Father", purpose: "Dropping off medicines and food", visitorPhone: "7654321011", expectedArrival: new Date(now.getTime() + 86400000 * 2), status: "approved", qrCode: "VISITOR_001" },
    { studentId: students[1].id, visitorName: "Mrs. Geeta Singh", relation: "Mother", purpose: "Visiting ward, bringing home-cooked food", visitorPhone: "7654321012", expectedArrival: new Date(now.getTime() + 3 * 86400000), status: "pending", qrCode: "VISITOR_002" },
    { studentId: students[3].id, visitorName: "Rahul Mehta", relation: "Brother", purpose: "Casual visit", visitorPhone: "9988776655", expectedArrival: new Date(now.getTime() - 86400000), status: "visited", qrCode: "VISITOR_003", actualArrival: new Date(now.getTime() - 86400000 + 3600000), actualDeparture: new Date(now.getTime() - 86400000 + 7200000) },
  ]);

  console.log("Created visitors.");

  // Create announcements
  await db.insert(announcementsTable).values([
    { title: "Hostel Day Celebrations - June 20", content: "Annual Hostel Day celebrations will be held on June 20, 2026. All students are requested to participate in cultural events. Registration open at hostel office.", targetRole: "all", priority: "normal", createdById: adminUser.id },
    { title: "Mess Timing Change from Monday", content: "From next Monday, mess timings will change: Breakfast 7:00-9:00 AM, Lunch 12:00-2:00 PM, Dinner 7:00-9:00 PM. Please adhere to the new timings.", targetRole: "student", priority: "urgent", createdById: adminUser.id },
    { title: "Fee Payment Deadline - June 30", content: "Last date for paying June hostel fees is June 30, 2026. A penalty of Rs. 200/day will be charged after the due date. Contact admin office for payment mode details.", targetRole: "student", priority: "urgent", createdById: adminUser.id },
    { title: "Monthly Warden Meeting", content: "Monthly warden meeting scheduled for June 15 at 4 PM in Conference Room A. Attendance is mandatory. Please prepare block reports.", targetRole: "warden", priority: "normal", createdById: adminUser.id },
    { title: "Maintenance Work - Block B Floor 2", content: "Maintenance work for plumbing repairs will be carried out in Block B Floor 2 on June 14. Residents may face water supply disruption from 9 AM - 1 PM.", targetRole: "student", priority: "urgent", createdById: adminUser.id },
  ]);

  console.log("Created announcements.");

  // Create warden rounds
  for (let i = 6; i >= 0; i--) {
    const roundDate = new Date(now.getTime() - i * 86400000);
    for (const room of rooms.slice(0, 4)) {
      if (Math.random() > 0.2) {
        await db.insert(wardenRoundsTable).values({ wardenId: warden1.id, roomId: room.id, method: "manual" });
      }
    }
  }

  // Create block surveys
  await db.insert(blockSurveysTable).values([
    { blockId: blockA.id, studentId: students[0].id, weekStart: weekStartStr, safetyScore: 4, cleanlinessScore: 3, comfortScore: 4, overallScore: 3.67 },
    { blockId: blockA.id, studentId: students[1].id, weekStart: weekStartStr, safetyScore: 5, cleanlinessScore: 4, comfortScore: 4, overallScore: 4.33 },
    { blockId: blockC.id, studentId: students[3].id, weekStart: weekStartStr, safetyScore: 5, cleanlinessScore: 5, comfortScore: 5, overallScore: 5.0 },
  ]);

  // Create appointments
  await db.insert(appointmentsTable).values([
    { wardenId: warden1.id, studentId: students[0].id, requestedBy: parentUsers[0].id, scheduledAt: new Date(now.getTime() + 7 * 86400000), type: "in_person", status: "confirmed", notes: "Discussing student's academic performance and wellbeing" },
    { wardenId: warden2.id, studentId: students[3].id, requestedBy: parentUsers[1].id, scheduledAt: new Date(now.getTime() + 5 * 86400000), type: "virtual", status: "pending", notes: "Parent wants to discuss fee payment plan" },
  ]);

  // Create staff (gate staff)
  await db.insert(staffTable).values([
    { userId: gateUser.id, department: "Security", performanceScore: 88 },
  ]);

  console.log("Database seeded successfully!");
  console.log("\nDemo credentials:");
  console.log("  Admin:    admin@hostel.edu / admin123");
  console.log("  Warden:   warden1@hostel.edu / warden123");
  console.log("  Student:  arjun@student.edu / student123");
  console.log("  Parent:   parent1@hostel.edu / parent123");
  console.log("  Gate:     gate@hostel.edu / gate123");

  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
