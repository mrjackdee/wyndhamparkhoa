import { getPayload } from "payload";
import pg from "pg";
import config from "../src/payload.config";
import { initialSpotlight } from "../src/lib/initial-spotlight";
// Only seed the owner-approved initial Spotlight, once. Never overwrite editorial work.
const marker = "20261021_owner_approved_community_spotlight";
if (process.env.VERCEL_ENV !== "production") {
  console.log("Initial Spotlight import skipped outside production."); process.exit(0);
}
if (process.env.HOA_QA_SCHEMA) throw new Error("Production import cannot target QA.");
const db = new pg.Client({ connectionString: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL });
await db.connect();
let p: Awaited<ReturnType<typeof getPayload>> | undefined;
try {
  await db.query("SELECT pg_advisory_lock(21102026)");
  const done = await db.query("SELECT 1 FROM wphoa.payload_migrations WHERE name=$1", [marker]);
  if (!done.rowCount) {
    p = await getPayload({ config });
    const source = initialSpotlight.source + " Import: " + marker;
    const exists = await p.find({ collection: "spotlights", where: { source: { equals: source } }, depth: 0, limit: 2 });
    if (exists.docs.length > 1) throw new Error("Duplicate initial Spotlight; review needed.");
    if (!exists.docs.length) {
      const meeting = await p.find({ collection: "news", where: { slug: { equals: "meeting" } }, depth: 0, limit: 2 });
      if (meeting.docs.length !== 1) throw new Error("Expected the existing meeting recap.");
      await p.create({ collection: "spotlights", data: { ...initialSpotlight, source, recap: meeting.docs[0].id, featured: true, archived: false, _status: "published" } });
    }
    await db.query("INSERT INTO wphoa.payload_migrations (name,batch) VALUES ($1,1)", [marker]);
    console.log("Owner-approved Community Spotlight published; existing recap and photos preserved.");
  } else console.log("Initial Spotlight already imported; preserving all subsequent board edits.");
} finally {
  if (p) await p.destroy();
  await db.query("SELECT pg_advisory_unlock(21102026)");
  await db.end();
}
process.exit(0);
