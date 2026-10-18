import { getPayload } from "payload";
import config from "../src/payload.config";
if (process.env.LOCAL_TEST_MODE !== "true" || process.env.VERCEL || process.env.DATABASE_URL)
  throw new Error("Local preview database only.");
const p = await getPayload({ config });
try {
  const descriptions = [
    "A uniformed officer speaking to neighbors seated under a covered patio.",
    "Neighbors seated around the officer during the outdoor community meeting.",
    "A wider view of neighbors gathered on the patio for the community meeting.",
  ];
  const photos = [];
  for (let i = 0; i < 3; i++) {
    const photo = await p.create({ collection: "media", filePath: "../source-media/photo-" + i + ".jpeg",
      data: { title: "October 17 meeting photo " + (i + 1), alt: descriptions[i], category: "photo",
        source: "Owner-provided October 17, 2026 community meeting photograph, supplied via DonOra Drive.",
        visibility: "public" } });
    photos.push({ photo: photo.id, caption: i === 0 ? "" : descriptions[i] });
  }
  const story = await p.create({ collection: "news", data: {
    title: "October 17 Community Meeting Recap", slug: "meeting",
    summary: "Thank you to Sgt. A.D. Johnson and DKPD South Precinct for joining our October 17 community meeting and sharing safety and crime prevention information.",
    body: "At our community meeting on Saturday, October 17, 2026, Sgt. A.D. Johnson shared updates on crime statistics and recent incidents, discussed safety and crime prevention strategies, and explained the benefits of camera systems.\n\nWyndham Park HOA thanks Sgt. Johnson and DKPD South Precinct for spending time with our community. South Precinct also expressed appreciation for the community’s support.",
    source: "DKPD caption supplied by the owner; existing meeting page verifies October 17, 2026 at 9 AM.",
    kind: "event", eventDate: "2026-10-17T13:00:00.000Z", timezone: "America/New_York",
    location: "Community meeting", photos, photosApproved: true, featured: true,
    linkLabel: "Read the recap & view photos", _status: "published",
  } });
  console.log("Local meeting preview:", story.slug);
} finally { await p.destroy(); }
