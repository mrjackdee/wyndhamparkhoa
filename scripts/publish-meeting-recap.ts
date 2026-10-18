import { getPayload } from "payload";
import pg from "pg";
import config from "../src/payload.config";

// Owner-approved, one-time content migration through the existing deployment identity.
// No public endpoint, user account, credential, or access-rule change is involved.
const marker = "20261018_owner_approved_meeting_recap";
if (process.env.VERCEL_ENV !== "production") {
  console.log("Meeting recap import skipped outside production.");
  process.exit(0);
}
if (process.env.HOA_QA_SCHEMA) throw new Error("Production recap cannot target a QA schema.");
const db = new pg.Client({ connectionString: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL });
await db.connect();
let payload: Awaited<ReturnType<typeof getPayload>> | undefined;
try {
  await db.query("SELECT pg_advisory_lock(18102026)");
  const done = await db.query("SELECT 1 FROM wphoa.payload_migrations WHERE name=$1", [marker]);
  if (!done.rowCount) {
    payload = await getPayload({ config });
    const matches = await payload.find({ collection: "news", where: { slug: { equals: "meeting" } }, depth: 0, limit: 2 });
    if (matches.docs.length !== 1) throw new Error("Expected exactly one existing meeting record.");
    const meeting = matches.docs[0];
    const source = "Owner-approved October 17, 2026 recap; DKPD caption and three original owner-provided photographs. Import: " + marker;
    if (meeting.source !== source && (meeting.id !== 2 || meeting.updatedAt !== "2026-10-14T02:01:47.572Z"))
      throw new Error("Meeting changed since review; refusing to overwrite newer editorial work.");
    const specs = [
      ["officer-speaking.jpeg", "A uniformed officer speaking to neighbors seated under a covered patio.", "libfile_42d09c0d48c88191a560cd7288ac2aac"],
      ["community-gathering.jpeg", "Neighbors seated around the officer during the outdoor community meeting.", "libfile_2d541f0ba27c819181c03bf36e358048"],
      ["patio-gathering.jpeg", "A wider view of neighbors gathered on the patio for the community meeting.", "libfile_6f7ac2b1676c819189c908920bb8e3d2"],
    ];
    const photos = [];
    for (const [filename, alt, libraryId] of specs) {
      const photoSource = `Owner-provided October 17, 2026 meeting photograph; ChatGPT Library ${libraryId}; ${marker}.`;
      const existing = await payload.find({ collection: "media", where: { source: { equals: photoSource } }, limit: 2 });
      if (existing.docs.length > 1) throw new Error("Duplicate imported photo; review required.");
      const photo = existing.docs[0] ?? await payload.create({ collection: "media",
        filePath: `assets/meeting-2026-10-17/${filename}`,
        data: { title: "October 17 meeting — " + filename.replace(".jpeg", "").replaceAll("-", " "),
          alt, source: photoSource, category: "photo", visibility: "public" } });
      photos.push({ photo: photo.id, caption: alt });
    }
    if (meeting.source !== source) await payload.update({ collection: "news", id: meeting.id, data: {
      title: "October 17 Community Meeting Recap",
      summary: "Thank you to Sgt. A.D. Johnson and DKPD South Precinct for joining our October 17 community meeting and sharing safety and crime prevention information.",
      body: "At our community meeting on Saturday, October 17, 2026, Sgt. A.D. Johnson shared updates on crime statistics and recent incidents, discussed safety and crime prevention strategies, and explained the benefits of camera systems.\n\nWyndham Park HOA thanks Sgt. Johnson and DKPD South Precinct for spending time with our community. South Precinct also expressed appreciation for the community's support.",
      source, photos, photosApproved: true, featured: true,
      linkLabel: "Read the recap & view photos", _status: "published",
    } });
    const result = await payload.findByID({ collection: "news", id: meeting.id, depth: 1 });
    if (result.createdAt !== meeting.createdAt || result.slug !== "meeting" || result.photos?.length !== 3)
      throw new Error("Imported meeting verification failed.");
    await db.query("INSERT INTO wphoa.payload_migrations (name, batch) VALUES ($1, 1)", [marker]);
    console.log("Owner-approved recap published on existing meeting record with three original photos.");
  } else console.log("Meeting recap already imported; preserving subsequent admin edits.");
} finally {
  if (payload) await payload.destroy();
  await db.query("SELECT pg_advisory_unlock(18102026)");
  await db.end();
}
// Payload retains idle database handles; writes are complete and the migration lock is released.
process.exit(0);

