import assert from "node:assert/strict";
const base = "http://localhost:3000";
const login = await fetch(base + "/api/users/login", { method: "POST",
  headers: { origin: base, "content-type": "application/json" },
  body: JSON.stringify({ email: "news-board@example.invalid", password: "local-synthetic-news-test-only" }) });
assert.equal(login.status, 200);
const { token } = await login.json();
const headers = { origin: base, "content-type": "application/json", cookie: "payload-token=" + token };
const listing = await (await fetch(base + "/api/news?where[slug][equals]=meeting")).json();
const story = listing.docs[0];
assert.ok(story);
const draft = await fetch(base + "/api/news/" + story.id + "?draft=true", {
  method: "PATCH", headers, body: JSON.stringify({ summary: "PRIVATE DRAFT CHECK", _status: "draft" }),
});
assert.equal(draft.status, 200, await draft.text());
assert.ok(!(await (await fetch(base + "/news/meeting")).text()).includes("PRIVATE DRAFT CHECK"));
assert.equal((await fetch(base + "/preview/news/" + story.id)).status, 404);
const preview = await fetch(base + "/preview/news/" + story.id, { headers });
assert.equal(preview.status, 200);
assert.ok((await preview.text()).includes("PRIVATE DRAFT CHECK"));
const publish = await fetch(base + "/api/news/" + story.id, {
  method: "PATCH", headers, body: JSON.stringify({ summary: story.summary, _status: "published" }),
});
assert.equal(publish.status, 200, await publish.text());
const homepage = await (await fetch(base)).text();
assert.ok(homepage.includes("Community News") && homepage.includes("Read the recap"));
const page = await (await fetch(base + "/news/meeting")).text();
assert.ok(page.includes("news-gallery"));
assert.equal(story.photos.length, 3);
for (const { photo } of story.photos) {
  const result = await fetch(photo.url);
  assert.equal(result.status, 200);
  assert.ok(result.headers.get("content-type").startsWith("image/"));
  assert.ok((await result.arrayBuffer()).byteLength > 300000);
}
console.log("PASS: real HTTP board draft/save/publish, private preview authorization, homepage feature, recap gallery and all three original images.");
