import pg from 'pg';
const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await client.connect();
const res = await client.query('DELETE FROM gate_passes RETURNING id');
console.log('Deleted gate passes with IDs:', res.rows.map(r => r.id).join(', ') || 'none');
await client.end();
