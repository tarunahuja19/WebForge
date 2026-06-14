import pg from 'pg';
const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  await client.connect();

  const yesterday = new Date(Date.now() - 86400000);
  const lastWeek = new Date(Date.now() - 86400000 * 7);

  const query = `
    INSERT INTO gate_passes (student_id, destination, purpose, expected_return, status, warden_remarks, created_at, qr_code)
    VALUES 
      (1, 'Supermarket', 'Groceries', $1, 'used', 'Approved, be safe', $2, 'HOSTEL_PASS_MOCK1'),
      (1, 'Local Cinema', 'Movie with friends', $3, 'rejected', 'Curfew is at 9PM', $4, 'HOSTEL_PASS_MOCK2')
    RETURNING id
  `;

  const res = await client.query(query, [
    new Date(yesterday.getTime() + 3600000 * 2).toISOString(), // expected_return
    yesterday.toISOString(), // created_at
    new Date(lastWeek.getTime() + 3600000 * 4).toISOString(), // expected_return
    lastWeek.toISOString() // created_at
  ]);

  console.log('Inserted mock gate passes with IDs:', res.rows.map(r => r.id).join(', '));
  await client.end();
}
run();
