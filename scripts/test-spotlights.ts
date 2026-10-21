import assert from "node:assert/strict";
import { getPayload, createLocalReq } from "payload";
import config from "../src/payload.config";
import { initialSpotlight } from "../src/lib/initial-spotlight";
if (process.env.LOCAL_TEST_MODE !== "true" || process.env.VERCEL || process.env.DATABASE_URL) throw new Error("Synthetic local storage only.");
const p = await getPayload({ config });
try {
  for (const role of ["administrator", "board", "editor"] as const) {
    const user = await p.create({ collection: "users", data: { email: `spotlight-${role}-${Date.now()}@example.invalid`, password: "synthetic-test-password-only", role, active: true } });
    let req = await createLocalReq({ user: { ...user, collection: "users" } }, p);
    const create = () => p.create({ collection: "spotlights", req, overrideAccess: false, draft: true, data: { ...initialSpotlight, title: "Synthetic " + role, _status: "draft", featured: true } });
    if (role === "editor") { await assert.rejects(create); console.log("PASS editor cannot manage Spotlight"); continue; }
    const draft = await create();
    assert.equal((await p.find({ collection: "spotlights", overrideAccess: false, where: { id: { equals: draft.id } } })).totalDocs, 0);
    assert.equal((await p.findByID({ collection: "spotlights", id: draft.id, req, overrideAccess: false, draft: true })).recognitions.length, 6);
    const published = await p.update({ collection: "spotlights", id: draft.id, req, overrideAccess: false, data: { _status: "published" } });
    assert.ok(published.featuredAt);
    const visible = await p.findByID({ collection: "spotlights", id: draft.id, overrideAccess: false });
    assert.equal(visible.title, "Synthetic " + role);
    assert.equal(visible.source, undefined);
    await p.update({ collection: "spotlights", id: draft.id, req, overrideAccess: false, draft: true, data: { title: "Unpublished edit", _status: "draft" } });
    assert.equal((await p.findByID({ collection: "spotlights", id: draft.id, overrideAccess: false })).title, "Synthetic " + role);
    const versions = await p.findVersions({ collection: "spotlights", req, overrideAccess: false, where: { parent: { equals: draft.id } }, limit: 30 });
    const old = versions.docs.find(v => v.version.title === "Synthetic " + role && v.version._status === "published");
    assert.ok(old);
    await p.restoreVersion({ collection: "spotlights", id: old.id, req, overrideAccess: false });
    req = await createLocalReq({ user: { ...user, collection: "users" } }, p);
    assert.equal((await p.findByID({ collection: "spotlights", id: draft.id, overrideAccess: false })).title, "Synthetic " + role);
    await p.update({ collection: "spotlights", id: draft.id, req, overrideAccess: false, data: { archived: true, _status: "published" } });
    assert.equal((await p.findByID({ collection: "spotlights", id: draft.id, overrideAccess: false })).archived, true);
    await assert.rejects(() => p.update({ collection: "spotlights", id: draft.id, overrideAccess: false, data: { title: "Unauthorized" } }));
    const photo = await p.create({ collection: "media", req, overrideAccess: false, filePath: "public/wyndham-park-entrance.jpeg", data: { title: "Synthetic test photo", alt: "Entrance sign", source: "Owner-provided photo, local test", category: "photo", visibility: "private" } });
    const entries = [{ ...initialSpotlight.recognitions[0], photo: photo.id }];
    await assert.rejects(() => p.update({ collection: "spotlights", id: draft.id, req, overrideAccess: false, data: { recognitions: entries, _status: "published" } }));
    assert.equal((await p.find({ collection: "media", overrideAccess: false, where: { id: { equals: photo.id } } })).totalDocs, 0);
    await p.update({ collection: "spotlights", id: draft.id, req, overrideAccess: false, data: { recognitions: entries, photosApproved: true, _status: "published" } });
    assert.equal((await p.findByID({ collection: "media", id: photo.id, overrideAccess: false })).visibility, "public");
    await p.update({ collection: "spotlights", id: draft.id, req, overrideAccess: false, data: { _status: "draft" } });
    assert.equal((await p.find({ collection: "spotlights", overrideAccess: false, where: { id: { equals: draft.id } } })).totalDocs, 0);
    console.log(`PASS ${role}: draft privacy, publish, private edits, restoration, archive, public-source filtering, anonymous denial, photo approval, unpublish`);
  }
} finally { await p.destroy(); }
process.exit(0);
