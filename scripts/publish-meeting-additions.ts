import { getPayload } from "payload";
import pg from "pg";
import config from "../src/payload.config";
const marker = "20261021_owner_approved_meeting_media";
if (process.env.VERCEL_ENV !== "production") { console.log("Additional media import skipped outside production."); process.exit(0); }
if (process.env.HOA_QA_SCHEMA) throw new Error("Production import cannot target QA.");
const db = new pg.Client({ connectionString: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL });
await db.connect();
let p: Awaited<ReturnType<typeof getPayload>> | undefined;
try {
  await db.query("SELECT pg_advisory_lock(21102027)");
  const done = await db.query("SELECT 1 FROM wphoa.payload_migrations WHERE name=$1", [marker]);
  if (!done.rowCount) {
    p = await getPayload({ config });
    const match = await p.find({ collection: "news", where: { slug: { equals: "meeting" } }, depth: 0, limit: 2 });
    if (match.docs.length !== 1) throw new Error("Expected one existing meeting recap.");
    const story = match.docs[0];
    const draft = await p.findByID({ collection: "news", id: story.id, draft: true, depth: 0 });
    if (story._status !== "published" || draft._status !== "published") throw new Error("Recap has unpublished edits; preserve them for board review.");
    const specs = [
      ["20261017_093643.jpg", "Neighbors seated on the patio during the October 17 community meeting.", "1m-NwD7K7Xo3z8Ud8tQLB_TWBZ_Mavz_L"],
      ["20261017_093750.jpg", "Wyndham Park quarterly general meeting agenda displayed on a screen.", "103ZPKfHf4hmC1bYTJzvqXTYP_FKMyNQ4"],
      ["20261017_104840.jpg", "Neighbors gathered beside the covered patio during the community meeting.", "1jkzRjLBpA18wJF2brQYP34LjHFQyQBNU"],
      ["IMG_4751.jpg", "Refreshments, cups, and a pitcher arranged for the community gathering.", "1WQbv1jw9weLkHTHyl0BSd8Vhe6PWRaoc"],
      ["IMG_4752.jpg", "Neighbors gathered outside near the patio and trees.", "1js-Byq_u0hvwvynT5a9DbmsfaQGtD8Z6"],
      ["IMG_4755.jpg", "A speaker addressing neighbors beside the meeting agenda screen.", "1Ymh8MvDyGiiaCcq4CLddzWYf5c9GtgFK"],
      ["IMG_4756.jpg", "A wider view of neighbors and refreshments at the patio gathering.", "1ZVr5MfQf9fur26n_b6CB-O7bkR7zuz6j"],
    ];
    const photos = [...(story.photos ?? [])];
    for (const [filename, alt, driveID] of specs) {
      const source = `Owner-approved October 17, 2026 meeting photo supplied through Pat's Drive folder; file ${driveID}; ${marker}.`;
      const existing = await p.find({ collection: "media", where: { source: { equals: source } }, limit: 2 });
      if (existing.docs.length > 1) throw new Error("Duplicate media import; review required.");
      const photo = existing.docs[0] ?? await p.create({ collection: "media", filePath: "assets/meeting-2026-10-17-additions/" + filename,
        data: { title: "October 17 meeting: " + filename, alt, source, category: "photo", visibility: "public" } });
      if (photo.visibility !== "public") await p.update({ collection: "media", id: photo.id, data: { visibility: "public" } });
      if (!photos.some(row => row.photo === photo.id)) photos.push({ photo: photo.id, caption: "" });
    }
    const videoSource = `Owner-approved video from Drive file 1x3kBPOpNDwhx6SIf0l1q_e0oOmZzSvxg. Audio track removed; H.264 video preserved; ${marker}.`;
    const oldVideo = await p.find({ collection: "media", where: { source: { equals: videoSource } }, limit: 1 });
    const video = oldVideo.docs[0] ?? await p.create({ collection: "media", filePath: "assets/meeting-2026-10-17-additions/community-meeting-silent.mp4",
      data: { title: "Community gathering thank-you video (no audio)", source: videoSource, category: "video", visibility: "public" } });
    if (video.visibility !== "public") await p.update({ collection: "media", id: video.id, data: { visibility: "public" } });
    await p.update({ collection: "news", id: story.id, data: { photos, photosApproved: true, video: video.id, videoApproved: true,
      videoDescription: "A silent Wyndham Park Fall Festival thank-you presentation celebrating neighbors coming together for food, shared meals, music, and conversation. It thanks the neighbors who planned the gathering and prepared food, thanks everyone who participated, and closes with: Together is what makes Wyndham Park a community. Looking forward to our next gathering!",
      _status: "published" } });
    const saved = await p.findByID({ collection: "news", id: story.id, depth: 0 });
    if (saved.photos?.length !== photos.length || saved.video !== video.id || saved.body !== story.body || saved.createdAt !== story.createdAt) throw new Error("Media import verification failed.");
    await db.query("INSERT INTO wphoa.payload_migrations (name,batch) VALUES ($1,1)", [marker]);
    console.log("Seven additional photos and one silent MP4 appended to the existing recap; prior content preserved.");
  } else console.log("Additional meeting media already imported; preserving board edits.");
} finally {
  if (p) await p.destroy();
  await db.query("SELECT pg_advisory_unlock(21102027)");
  await db.end();
}
process.exit(0);
