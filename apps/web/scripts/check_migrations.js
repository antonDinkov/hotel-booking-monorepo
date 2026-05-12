require('dotenv/config');
const { Client } = require('pg');

(async () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }
  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    const res = await client.query('SELECT * FROM drizzle.__drizzle_migrations ORDER BY id');
    console.log('drizzle.__drizzle_migrations rows count:', res.rowCount);
    console.table(res.rows);
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('error querying migrations:', err);
    try { await client.end(); } catch (e) {}
    process.exit(2);
  }
})();
