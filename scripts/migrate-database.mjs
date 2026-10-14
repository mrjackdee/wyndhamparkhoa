import pg from 'pg';
import { readFile } from 'node:fs/promises';
const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!connectionString) throw new Error('Database connection is missing.');
const client = new pg.Client({ connectionString });
try {
  await client.connect();
  await client.query('BEGIN');
  await client.query('SELECT pg_advisory_xact_lock(7262026)');
  const exists = await client.query("SELECT to_regclass('wphoa.payload_migrations') AS existing");
  if (!exists.rows[0].existing) {
    const source = await readFile(new URL('../src/migrations/20261013_232308.ts', import.meta.url), 'utf8');
    const sql = source.match(/export async function up[\s\S]*?await db.execute\(sql`([\s\S]*?)`\);/)[1];
    await client.query(sql);
    await client.query('INSERT INTO wphoa.payload_migrations (name, batch) VALUES ($1, $2)', ['20261013_232308', 1]);
  }
  const check = await client.query("SELECT count(*)::int AS count FROM information_schema.tables WHERE table_schema='wphoa'");
  if (check.rows[0].count < 20) throw new Error('Schema verification failed.');
  await client.query('COMMIT');
  console.log('Private HOA database schema initialized and verified.');
} catch (error) {
  await client.query('ROLLBACK').catch(() => {});
  console.error('Database initialization failed:', error.code || error.name);
  process.exitCode = 1;
} finally { await client.end(); }
