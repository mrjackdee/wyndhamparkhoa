import { migrateMembership } from './migrate-membership.mjs';
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
  await query("ALTER TYPE wphoa.enum_media_category ADD VALUE IF NOT EXISTS 'video'");
  for (const [table, prefix] of [['news', ''], ['_news_v', 'version_']]) {
    await query(`ALTER TABLE wphoa.${table} ADD COLUMN IF NOT EXISTS ${prefix}video_id integer REFERENCES wphoa.media(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS ${prefix}video_description varchar, ADD COLUMN IF NOT EXISTS ${prefix}video_approved boolean DEFAULT false`);
  }
  // Initialize once; subsequent deployments preserve the board's saved choice.
  for (const [table, prefix] of [['news', ''], ['_news_v', 'version_']]) {
    await query(`ALTER TABLE wphoa.${table} ADD COLUMN IF NOT EXISTS ${prefix}show_photo_gallery boolean`);
    await query(`UPDATE wphoa.${table} SET ${prefix}show_photo_gallery = (${prefix}slug <> 'meeting') WHERE ${prefix}show_photo_gallery IS NULL`);
    await query(`ALTER TABLE wphoa.${table} ALTER COLUMN ${prefix}show_photo_gallery SET DEFAULT false`);
  }
  await query('ALTER TABLE wphoa.media ADD COLUMN IF NOT EXISTS prefix varchar, ADD COLUMN IF NOT EXISTS _objectkey varchar');
  for (const [table, prefix] of [['news', ''], ['_news_v', 'version_']]) {
    await query(`ALTER TABLE wphoa.${table}
      ADD COLUMN IF NOT EXISTS ${prefix}featured boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS ${prefix}photos_approved boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS ${prefix}link_label varchar DEFAULT 'Read the story & view photos'`);
  }
  await query(`CREATE TABLE IF NOT EXISTS wphoa.news_photos (
    _order integer NOT NULL, _parent_id integer NOT NULL REFERENCES wphoa.news(id) ON DELETE CASCADE,
    id varchar PRIMARY KEY NOT NULL, photo_id integer REFERENCES wphoa.media(id) ON DELETE SET NULL, caption varchar)`);
  await query(`CREATE TABLE IF NOT EXISTS wphoa._news_v_version_photos (
    _order integer NOT NULL, _parent_id integer NOT NULL REFERENCES wphoa._news_v(id) ON DELETE CASCADE,
    id serial PRIMARY KEY NOT NULL, photo_id integer REFERENCES wphoa.media(id) ON DELETE SET NULL,
    caption varchar, _uuid varchar)`);
  for (const table of ['news_photos', '_news_v_version_photos']) {
    await query(`CREATE INDEX IF NOT EXISTS ${table}_order_idx ON wphoa.${table} (_order)`);
    await query(`CREATE INDEX IF NOT EXISTS ${table}_parent_id_idx ON wphoa.${table} (_parent_id)`);
    await query(`CREATE INDEX IF NOT EXISTS ${table}_photo_idx ON wphoa.${table} (photo_id)`);
    await query(`ALTER TABLE wphoa.${table} ENABLE ROW LEVEL SECURITY`);
  }
  for (const table of ['site_settings_leadership', '_site_settings_v_version_leadership']) {
    await query(`ALTER TABLE wphoa.${table} ADD COLUMN IF NOT EXISTS "group" varchar DEFAULT 'Board Members', ALTER COLUMN phone DROP NOT NULL`);
  }
  await query("ALTER TYPE wphoa.enum_users_role ADD VALUE IF NOT EXISTS 'board'");
  await query('ALTER TABLE wphoa.residents ADD COLUMN IF NOT EXISTS signed_up_at timestamp(3) with time zone');
  await query(`UPDATE wphoa.residents r SET signed_up_at = s.first_signup
    FROM (SELECT resident_id, min(created_at) AS first_signup FROM wphoa.submissions
      WHERE resident_id IS NOT NULL AND request_type = 'new' AND status = 'reviewed'
      GROUP BY resident_id) s WHERE r.id = s.resident_id AND r.signed_up_at IS NULL`);
  await query(`DO $$ BEGIN CREATE TYPE wphoa.enum_feedback_category AS ENUM ('issue','suggestion','other'); EXCEPTION WHEN duplicate_object THEN null; END $$`);
  await query(`DO $$ BEGIN CREATE TYPE wphoa.enum_feedback_status AS ENUM ('new','reviewing','resolved'); EXCEPTION WHEN duplicate_object THEN null; END $$`);
  await query(`DO $$ BEGIN CREATE TYPE wphoa.enum_feedback_notification AS ENUM ('pending','sent','failed'); EXCEPTION WHEN duplicate_object THEN null; END $$`);
  await query(`CREATE TABLE IF NOT EXISTS wphoa.feedback (
    id serial PRIMARY KEY, name varchar NOT NULL, email varchar NOT NULL,
    category wphoa.enum_feedback_category NOT NULL, subject varchar NOT NULL, page_url varchar,
    message varchar NOT NULL, status wphoa.enum_feedback_status NOT NULL DEFAULT 'new', notes varchar,
    attachments jsonb, idempotency_key varchar NOT NULL UNIQUE, privacy_accepted_at timestamptz NOT NULL,
    notification wphoa.enum_feedback_notification DEFAULT 'pending', notification_attempts numeric DEFAULT 0,
    notification_last_attempt timestamptz, updated_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now())`);
  await query('ALTER TABLE wphoa.payload_locked_documents_rels ADD COLUMN IF NOT EXISTS feedback_id integer REFERENCES wphoa.feedback(id) ON DELETE CASCADE');
  await query(await readFile(new URL('./spotlights-schema.sql', import.meta.url), 'utf8'));
  console.log('Starting protected Membership migration.');
  await migrateMembership(client, schema);
  const check = await query("SELECT count(*)::int AS count FROM information_schema.tables WHERE table_schema='wphoa'");
  if (check.rows[0].count < 20) throw new Error('Schema verification failed.');
  await query('COMMIT');
  console.log('Private HOA database schema initialized and verified.');
} catch (error) {
  await query('ROLLBACK').catch(() => {});
  console.error('Database initialization failed:', error.code || error.constructor.name);
  process.exitCode = 1;
} finally { await client.end(); }
