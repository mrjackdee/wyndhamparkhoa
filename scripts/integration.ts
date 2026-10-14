import { getPayload, createLocalReq } from "payload";
import config from "../src/payload.config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { notifySubmission, takeRateSlot } from "../src/lib/submission";
if (!((process.env.LOCAL_TEST_MODE === "true" && !process.env.VERCEL) || /^wphoa_qa_[a-f0-9]{12}$/.test(process.env.HOA_QA_SCHEMA ?? "")))
  throw new Error("Synthetic local tests only");
const p = await getPayload({ config });
const cleanup: {
  collection: "users" | "residents" | "submissions" | "news" | "media";
  id: number;
}[] = [];
let checks = 0;
const check = (name: string) => {
  checks++;
  console.log("PASS: " + name);
};
try {
  const admin = (
    await p.find({
      collection: "users",
      where: { email: { equals: process.env.BOOTSTRAP_ADMIN_EMAIL } },
    })
  ).docs[0];
  assert.ok(admin);
  const editor = await p.create({
    collection: "users",
    data: {
      email: "qa-editor-" + randomUUID() + "@example.invalid",
      password: randomUUID(),
      role: "editor",
      active: true,
    },
  });
  cleanup.push({ collection: "users", id: editor.id });
  const adminReq = await createLocalReq(
    { user: { ...admin, collection: "users" } },
    p,
  );
  const editorReq = await createLocalReq(
    { user: { ...editor, collection: "users" } },
    p,
  );
  const visitorReq = await createLocalReq({}, p);
  const resident = await p.create({
    collection: "residents",
    overrideAccess: false,
    req: adminReq,
    data: {
      name: "Synthetic Resident",
      email: "synthetic@example.invalid",
      address: "123 Test Only Lane",
      textGroup: "no",
      facebookGroup: "yes",
      status: "active",
    },
  });
  cleanup.push({ collection: "residents", id: resident.id });
  for (const req of [visitorReq, editorReq]) {
    await assert.rejects(() =>
      p.find({ collection: "residents", overrideAccess: false, req }),
    );
    await assert.rejects(() =>
      p.find({ collection: "submissions", overrideAccess: false, req }),
    );
    await assert.rejects(() =>
      p.find({ collection: "audit", overrideAccess: false, req }),
    );
  }
  check(
    "Anonymous visitors and editors cannot read residents, submissions, or audit logs",
  );
  await assert.rejects(() =>
    p.create({
      collection: "users",
      overrideAccess: false,
      req: visitorReq,
      data: {
        email: "attack@example.invalid",
        password: randomUUID(),
        role: "administrator",
        active: true,
      },
    }),
  );
  await assert.rejects(() =>
    p.update({
      collection: "users",
      id: editor.id,
      overrideAccess: false,
      req: editorReq,
      data: { role: "administrator" },
    }),
  );
  check("Public account creation and editor role escalation denied");
  const draft = await p.create({
    collection: "news",
    overrideAccess: false,
    req: editorReq,
    draft: true,
    data: {
      title: "Synthetic draft",
      slug: "qa-" + randomUUID(),
      summary: "Test only",
      body: "Test only",
      source: "Synthetic QA fixture",
      kind: "announcement",
      _status: "draft",
    },
  });
  cleanup.push({ collection: "news", id: draft.id });
  assert.equal(
    (
      await p.find({
        collection: "news",
        overrideAccess: false,
        req: visitorReq,
        where: { id: { equals: draft.id } },
      })
    ).totalDocs,
    0,
  );
  check("Draft announcement invisible to public");
  await p.update({
    collection: "news",
    id: draft.id,
    overrideAccess: false,
    req: editorReq,
    data: { _status: "published" },
  });
  assert.equal(
    (
      await p.find({
        collection: "news",
        overrideAccess: false,
        req: visitorReq,
        where: { id: { equals: draft.id } },
      })
    ).totalDocs,
    1,
  );
  check("Editor can publish; published announcement becomes publicly readable");
  await p.update({
    collection: "news",
    id: draft.id,
    overrideAccess: false,
    req: editorReq,
    data: { archived: true },
  });
  assert.equal(
    (
      await p.find({
        collection: "news",
        overrideAccess: false,
        req: visitorReq,
        where: { id: { equals: draft.id } },
      })
    ).totalDocs,
    0,
  );
  check("Archived announcement disappears from public");
  const versions = await p.findVersions({
    collection: "news",
    overrideAccess: false,
    req: editorReq,
    where: { parent: { equals: draft.id } },
  });
  assert.ok(versions.totalDocs > 0);
  await assert.rejects(() =>
    p.findVersions({
      collection: "news",
      overrideAccess: false,
      req: visitorReq,
    }),
  );
  check("Content history exists and is restricted to staff");
  const old = versions.docs.find(
    (v) => v.version._status === "published" && !v.version.archived,
  );
  assert.ok(old);
  await p.restoreVersion({
    collection: "news",
    id: old.id,
    overrideAccess: false,
    req: editorReq,
  });
  assert.equal(
    (
      await p.find({
        collection: "news",
        overrideAccess: false,
        where: { id: { equals: draft.id } },
      })
    ).totalDocs,
    1,
  );
  check("Restoring a published version restores public content");
  await p.update({
    collection: "news",
    id: draft.id,
    draft: true,
    overrideAccess: false,
    req: editorReq,
    data: { body: "PRIVATE NEW DRAFT", _status: "draft" },
  });
  const publishedDoc = await p.findByID({
    collection: "news",
    id: draft.id,
    overrideAccess: false,
  });
  assert.notEqual(publishedDoc.body, "PRIVATE NEW DRAFT");
  check("New draft changes do not replace existing published text");
  const media = await p.create({
    collection: "media",
    overrideAccess: false,
    req: editorReq,
    data: {
      title: "Synthetic private image",
      alt: "Synthetic test photo",
      category: "photo",
      visibility: "private",
      source: "QA fixture",
    },
    file: {
      data: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLttAAAAABJRU5ErkJggg==",
        "base64",
      ),
      mimetype: "image/png",
      name: "qa.png",
      size: 70,
    },
  });
  cleanup.push({ collection: "media", id: media.id });
  assert.equal(
    (
      await p.find({
        collection: "media",
        overrideAccess: false,
        where: { id: { equals: media.id } },
      })
    ).totalDocs,
    0,
  );
  await p.update({
    collection: "media",
    id: media.id,
    overrideAccess: false,
    req: await createLocalReq({ user: { ...editor, collection: "users" } }, p),
    data: { visibility: "public" },
  });
  assert.equal(
    (
      await p.find({
        collection: "media",
        overrideAccess: false,
        where: { id: { equals: media.id } },
      })
    ).totalDocs,
    1,
  );
  check("Private image upload is inaccessible until explicitly published");
  await assert.rejects(() =>
    p.create({
      collection: "media",
      overrideAccess: false,
      req: editorReq,
      data: {
        title: "Fake",
        alt: "Fake",
        category: "photo",
        visibility: "private",
        source: "Synthetic",
      },
      file: {
        data: Buffer.from("<script>alert(1)</script>"),
        mimetype: "image/png",
        name: "fake.png",
        size: 25,
      },
    }),
  );
  check("Upload with forged content type rejected");
  const before = await p.findByID({ collection: "residents", id: resident.id });
  await p.update({
    collection: "residents",
    id: resident.id,
    overrideAccess: false,
    req: adminReq,
    data: { textGroup: "yes", mobile: "555-555-0100" },
  });
  const after = await p.findByID({ collection: "residents", id: resident.id });
  assert.equal(
    after.preferenceHistory!.length,
    before.preferenceHistory!.length + 1,
  );
  check("Communication preference changes recorded with timestamps");
  const key = randomUUID();
  const submission = await p.create({
    collection: "submissions",
    data: {
      name: "Synthetic Update",
      email: "synthetic@example.invalid",
      address: "123 Test Only Lane",
      textGroup: "no",
      facebookGroup: "no",
      requestType: "update",
      idempotencyKey: key,
      privacyAcceptedAt: new Date().toISOString(),
    },
  });
  cleanup.push({ collection: "submissions", id: submission.id });
  assert.equal(
    (await p.findByID({ collection: "residents", id: resident.id })).name,
    "Synthetic Resident",
  );
  check("Update request cannot overwrite an existing resident");
  await assert.rejects(() =>
    p.create({
      collection: "submissions",
      data: {
        name: "Duplicate",
        email: "synthetic@example.invalid",
        address: "123 Test Only Lane",
        textGroup: "no",
        facebookGroup: "no",
        requestType: "new",
        idempotencyKey: key,
        privacyAcceptedAt: new Date().toISOString(),
      },
    }),
  );
  check("Unique idempotency key prevents duplicate submission storage");
  await notifySubmission(p, submission.id);
  const failed = await p.findByID({
    collection: "submissions",
    id: submission.id,
  });
  assert.equal(failed.notification, "failed");
  assert.equal(failed.notificationAttempts, 1);
  assert.equal(failed.name, "Synthetic Update");
  check("Notification failure retains durable submission and retry state");
  const ip = "qa-" + randomUUID();
  for (let i = 0; i < 5; i++) assert.equal(await takeRateSlot(p, ip), true);
  assert.equal(await takeRateSlot(p, ip), false);
  check(
    "Durable rate limiter allows five requests then rejects additional requests",
  );
  await p.update({
    collection: "users",
    id: editor.id,
    data: { active: false },
  });
  await assert.rejects(() =>
    p
      .find({
        collection: "news",
        overrideAccess: false,
        req: editorReq,
        draft: true,
        where: { id: { equals: draft.id } },
      })
      .then((r) => {
        if (!r.totalDocs) throw new Error("Access correctly denied");
      }),
  );
  check("Revoked editor cannot access drafts using stale user claims");
  const dues = (
    await p.find({ collection: "dues", overrideAccess: false })
  ).docs.find((d) => d.year === 2026)!;
  assert.equal(dues.amount, 160);
  assert.equal(dues.paymentEmail, "wyndhamparkhoa@yahoo.com");
  assert.deepEqual(
    dues.contacts?.map((c) => [c.name, c.role, c.phone]),
    [
      ["Edith Lee", "Membership Chair", "770-713-1529"],
      ["Nate Thornton", "President", "678-641-7175"],
      ["Terry Harrison", "Interim Treasurer", "678-463-1872"],
    ],
  );
  check(
    "Dues year, amount, email, names, roles and telephone numbers match supplied flyer",
  );
  console.log(`${checks} integration checks passed.`);
} finally {
  for (const item of cleanup.reverse())
    await p.delete({ ...item, overrideAccess: true });
  await p.delete({
    collection: "rate-limits",
    where: { id: { exists: true } },
    overrideAccess: true,
  });
  await p.destroy();
}

process.exit(0);
