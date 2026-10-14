import pg from 'pg';
import { readFile } from 'node:fs/promises';
const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!connectionString) throw new Error('Database connection is missing.');
const schema = process.env.HOA_QA_SCHEMA ?? "wphoa";
if (schema !== "wphoa" && !/^wphoa_qa_[a-f0-9]{12}$/.test(schema)) throw new Error("Invalid QA schema");
const client = new pg.Client({ connectionString });
const query = (sql, params) => client.query(sql.replaceAll("wphoa", schema), params);
try {
  await client.connect();
  await query('BEGIN');
  await query('SELECT pg_advisory_xact_lock(7262026)');
  const exists = await query("SELECT to_regclass('wphoa.payload_migrations') AS existing");
  if (!exists.rows[0].existing) {
    const source = await readFile(new URL('../src/migrations/20261013_232308.ts', import.meta.url), 'utf8');
    const sql = source.match(/export async function up[\s\S]*?await db.execute\(sql`([\s\S]*?)`\);/)[1];
    await query(sql);
    await query('INSERT INTO wphoa.payload_migrations (name, batch) VALUES ($1, $2)', ['20261013_232308', 1]);
  }
  await query('ALTER TABLE wphoa.media ADD COLUMN IF NOT EXISTS prefix varchar, ADD COLUMN IF NOT EXISTS _objectkey varchar');
  for (const table of ['site_settings_leadership', '_site_settings_v_version_leadership']) {
    await query(`ALTER TABLE wphoa.${table} ADD COLUMN IF NOT EXISTS "group" varchar DEFAULT 'Board Members', ALTER COLUMN phone DROP NOT NULL`);
  }
  const check = await query("SELECT count(*)::int AS count FROM information_schema.tables WHERE table_schema='wphoa'");
  if (check.rows[0].count < 20) throw new Error('Schema verification failed.');
  await query('COMMIT');
  console.log('Private HOA database schema initialized and verified.');
} catch (error) {
  await query('ROLLBACK').catch(() => {});
  console.error('Database initialization failed:', error.code || error.name);
  process.exitCode = 1;
} finally { await client.end(); }
