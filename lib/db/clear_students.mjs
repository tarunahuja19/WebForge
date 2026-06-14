import pg from 'pg';
const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function clearStudents() {
  await client.connect();

  console.log('Clearing student-related data...');
  
  // Delete all dependencies of students
  await client.query('DELETE FROM appointments');
  await client.query('DELETE FROM block_surveys');
  await client.query('DELETE FROM visitor_requests');
  await client.query('DELETE FROM fee_records');
  await client.query('DELETE FROM mess_attendance');
  await client.query('DELETE FROM complaint_messages');
  await client.query('DELETE FROM complaints');
  await client.query('DELETE FROM leave_requests');
  await client.query('DELETE FROM gate_logs');
  await client.query('DELETE FROM gate_passes');
  await client.query('DELETE FROM room_allocations');
  
  // Delete students
  const resStudents = await client.query('DELETE FROM students RETURNING id');
  console.log(`Deleted ${resStudents.rowCount} students.`);

  // Delete student and parent users
  const resUsers = await client.query(`DELETE FROM users WHERE role IN ('student', 'parent') RETURNING id`);
  console.log(`Deleted ${resUsers.rowCount} student/parent users.`);

  // Reset room status
  await client.query(`UPDATE rooms SET status = 'available'`);
  console.log('Reset all rooms to available.');

  await client.end();
  console.log('Done!');
}

clearStudents().catch(console.error);
