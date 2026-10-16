import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { getPayload, createLocalReq } from "payload";
import config from "../src/payload.config";
import { notifyFeedback } from "../src/lib/feedback";
import { GET } from "../src/app/api/feedback/[id]/route";
if (
  process.env.LOCAL_TEST_MODE !== "true" ||
  process.env.VERCEL ||
  process.env.TEST_DATABASE_URL !== "file:./review-qa.db"
)
  throw new Error("Isolated test database required");
const payload = await getPayload({ config });
try {
  const doc = await payload.create({
    collection: "feedback",
    data: {
      name: "Synthetic feedback",
      email: "qa@example.invalid",
      subject: "Test feedback",
      message: "This is synthetic feedback.",
      category: "issue",
      status: "new",
      idempotencyKey: randomUUID(),
      privacyAcceptedAt: new Date().toISOString(),
      attachments: [],
    },
  });
  const original = payload.sendEmail;
  payload.sendEmail = async () => {
    throw new Error("Synthetic email failure");
  };
  await notifyFeedback(payload, doc.id);
  assert.equal(
    (await payload.findByID({ collection: "feedback", id: doc.id }))
      .notification,
    "failed",
  );
  let deliveries = 0;
  payload.sendEmail = async (options) => {
    assert.equal(options.to, "support@wyndhamparkhoa.org");
    assert.ok(!String(options.text).includes(doc.message));
    deliveries++;
  };
  await notifyFeedback(payload, doc.id);
  await notifyFeedback(payload, doc.id);
  assert.equal(deliveries, 1);
  payload.sendEmail = original;
  const context = { params: Promise.resolve({ id: String(doc.id) }) };
  assert.equal(
    (
      await GET(
        new Request(`http://localhost:3000/api/feedback/${doc.id}`),
        context,
      )
    ).status,
    403,
  );
  for (const role of ["board", "editor"] as const) {
    const u = await payload.create({
      collection: "users",
      data: {
        email: `${role}-${randomUUID()}@example.invalid`,
        role,
        password: "synthetic-feedback-password",
        active: true,
      },
    });
    const login = await payload.login({
      collection: "users",
      data: { email: u.email, password: "synthetic-feedback-password" },
    });
    const r = await GET(
      new Request(`http://localhost:3000/api/feedback/${doc.id}`, {
        headers: {
          origin: "http://localhost:3000",
          cookie: `payload-token=${login.token}`,
        },
      }),
      context,
    );
    assert.equal(r.status, role === "board" ? 200 : 403);
    const req = await createLocalReq(
      { user: { ...u, collection: "users" } },
      payload,
    );
    if (role === "board") {
      const list = await payload.find({
        collection: "feedback",
        overrideAccess: false,
        req,
      });
      assert.ok(list.docs.length);
      assert.equal(list.docs[0].attachments, undefined);
    } else
      await assert.rejects(
        payload.find({ collection: "feedback", overrideAccess: false, req }),
      );
  }
  console.log(
    "PASS: private feedback access, board/editor boundaries, notification failure retention and retry without duplicates",
  );
} finally {
  await payload.destroy();
}
