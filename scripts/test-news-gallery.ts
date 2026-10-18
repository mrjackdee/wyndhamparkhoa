import assert from "node:assert/strict";
import { getPayload, createLocalReq } from "payload";
import config from "../src/payload.config";
if (process.env.LOCAL_TEST_MODE !== "true" || process.env.VERCEL || process.env.DATABASE_URL)
  throw new Error("Local synthetic test database only.");
const p = await getPayload({ config });
try {
  for (const userRole of ["administrator", "board"] as const) {
    const email = "news-" + userRole + "@example.invalid";
    let user = (await p.find({ collection: "users", where: { email: { equals: email } } })).docs[0];
    user ??= await p.create({ collection: "users", data: {
      email, password: "local-synthetic-news-test-only", role: userRole, active: true,
    } });
    const req = await createLocalReq({ user: { ...user, collection: "users" } }, p);
    const photos = [];
    for (let i = 0; i < 3; i++) {
      const photo = await p.create({ collection: "media", overrideAccess: false, req,
        filePath: "public/wyndham-park-entrance.jpeg",
        data: { title: "Local fixture " + i, alt: "Wyndham Park entrance sign, local layout fixture",
          category: "photo", source: "Existing owner-provided entrance photograph; local testing only.", visibility: "private" } });
      photos.push({ photo: photo.id, caption: "Local layout test photo " + (i + 1) });
    }
    const draft = await p.create({ collection: "news", overrideAccess: false, req, draft: true, data: {
      title: "Local gallery " + userRole + " " + Date.now(), slug: "local-gallery-" + userRole + "-" + Date.now(),
      summary: "Synthetic gallery used only to verify the editor workflow.",
      body: "This is a local test. It is not a meeting recap.", source: "Local QA fixture, 2026",
      kind: "announcement", photos, featured: true, _status: "draft",
    } });
    assert.equal((await p.find({ collection: "news", overrideAccess: false, where: { id: { equals: draft.id } } })).totalDocs, 0);
    assert.equal((await p.find({ collection: "media", overrideAccess: false, where: { id: { equals: photos[0].photo } } })).totalDocs, 0);
    const preview = await p.findByID({ collection: "news", id: draft.id, overrideAccess: false, req, draft: true, depth: 1 });
    assert.equal(preview.photos?.length, 3);
    await assert.rejects(() => p.update({ collection: "news", id: draft.id, overrideAccess: false, req,
      data: { _status: "published" } }), (error: unknown) =>
        error instanceof Error && "data" in error &&
        JSON.stringify(error.data).includes("approved for the public website"));
    const saved = await p.update({ collection: "news", id: draft.id, overrideAccess: false, req,
      data: { photos: [...photos].reverse(), photosApproved: true, _status: "published" } });
    assert.equal(saved.createdAt, draft.createdAt);
    const publicStory = await p.findByID({ collection: "news", id: draft.id, overrideAccess: false, depth: 1 });
    assert.equal(publicStory.photos?.length, 3);
    const cover = publicStory.photos![0].photo;
    assert.equal(typeof cover === "object" && cover?.id, photos[2].photo);
    assert.equal(typeof cover === "object" && cover?.visibility, "public");
    await assert.rejects(() => p.update({ collection: "news", id: draft.id, overrideAccess: false, data: { title: "Anonymous edit" } }));
    console.log("PASS:", userRole, "private draft, preview, approval validation, publish, cover reorder, preserved creation time, anonymous denial");
  }
} finally { await p.destroy(); }
