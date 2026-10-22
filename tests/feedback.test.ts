import { test } from "node:test";
import assert from "node:assert/strict";
import { feedbackSchema, attachmentType, looksLikeAutomatedFeedback } from "../src/lib/feedback";
test("feedback requires valid contact, message, consent and honeypot", () => {
  const valid = {
    name: "Synthetic",
    email: "qa@example.invalid",
    subject: "Website suggestion",
    message: "Make this page easier to find.",
    category: "suggestion",
    pageUrl: "",
    website: "",
    privacy: "on",
    token: "test",
    idempotencyKey: "550e8400-e29b-41d4-a716-446655440000",
  };
  assert.equal(feedbackSchema.safeParse(valid).success, true);
  for (const change of [
    { email: "bad" },
    { message: "short" },
    { privacy: "" },
    { website: "spam" },
    { pageUrl: "javascript:alert(1)" },
  ])
    assert.equal(
      feedbackSchema.safeParse({ ...valid, ...change }).success,
      false,
    );
});
test("attachments require supported file signatures", () => {
  assert.equal(attachmentType(Buffer.from("<script>bad</script>")), null);
  assert.equal(attachmentType(Buffer.from("%PDF-1.7")), "application/pdf");
  assert.equal(attachmentType(Buffer.from([255, 216, 255])), "image/jpeg");
  assert.equal(
    attachmentType(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
    "image/png",
  );
});

test("rejects paired scrambled fields without blocking normal names and subjects", () => {
  assert.equal(looksLikeAutomatedFeedback("aBcDeFgHiJkLmNoP", "qRsTuVwXyZaBcDeF"), true);
  for (const [name, subject] of [
    ["Anne McDonald", "Website feedback"], ["José García", "HOA WEBSITE"],
    ["李明", "网站建议"], ["Christopher", "Registration"],
    ["aBcDeFgHiJkLmNoP", "Problem with login"],
    ["Jack Dee", "qRsTuVwXyZaBcDeF"],
  ]) assert.equal(looksLikeAutomatedFeedback(name, subject), false);
});
