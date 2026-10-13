import { test } from "node:test";
import assert from "node:assert/strict";
import { signupSchema, csvCell } from "../src/lib/validation";
import { formToken, verifyToken, sameOrigin } from "../src/lib/security";
import { randomUUID } from "node:crypto";
process.env.PAYLOAD_SECRET = "synthetic-test-secret-for-unit-tests-only";
const valid = () => ({
  name: "Test Neighbor",
  spouseName: "",
  address: "123 Synthetic Lane",
  email: "neighbor@example.invalid",
  mobile: "",
  textGroup: "no",
  facebookGroup: "yes",
  requestType: "new",
  privacy: true,
  idempotencyKey: randomUUID(),
  token: "test",
  website: "",
});
test("valid form preserves separate preferences and optional spouse/mobile", () => {
  const p = signupSchema.parse(valid());
  assert.equal(p.textGroup, "no");
  assert.equal(p.facebookGroup, "yes");
  assert.equal(p.mobile, "");
});
test("mobile is required only for text preference yes", () => {
  assert.equal(
    signupSchema.safeParse({ ...valid(), textGroup: "yes" }).success,
    false,
  );
  assert.equal(
    signupSchema.safeParse({
      ...valid(),
      textGroup: "yes",
      mobile: "555-555-0100",
    }).success,
    true,
  );
});
test("required fields, malformed email, unchosen preferences and privacy rejected", () => {
  for (const patch of [
    { name: "" },
    { address: "" },
    { email: "bad" },
    { textGroup: "" },
    { facebookGroup: "" },
    { privacy: false },
  ])
    assert.equal(
      signupSchema.safeParse({ ...valid(), ...patch }).success,
      false,
    );
});
test("honeypot, malformed idempotency key and excess input rejected", () => {
  for (const patch of [
    { website: "spam" },
    { idempotencyKey: "bad" },
    { name: "a".repeat(121) },
  ])
    assert.equal(
      signupSchema.safeParse({ ...valid(), ...patch }).success,
      false,
    );
});
test("signed form token rejects tampering, instant bots and expired forms", () => {
  const t = formToken();
  assert.equal(verifyToken(t), false);
  assert.equal(verifyToken(t, Date.now() + 2000), true);
  assert.equal(verifyToken(t, Date.now() + 7200001), false);
  assert.equal(verifyToken(t.slice(0, -1) + "x", Date.now() + 2000), false);
});
test("cross-origin request rejected", () => {
  assert.equal(
    sameOrigin(
      new Request("https://example.com/api", {
        headers: { origin: "https://attacker.invalid" },
      }),
    ),
    false,
  );
  assert.equal(
    sameOrigin(
      new Request("https://example.com/api", {
        headers: { origin: "https://example.com" },
      }),
    ),
    true,
  );
});
test("CSV escapes quotes, line breaks and spreadsheet formulas", () => {
  assert.equal(csvCell('=HYPERLINK("x")'), '"\'=HYPERLINK(""x"")"');
  assert.equal(csvCell("a\nb"), '"a\nb"');
  assert.equal(csvCell("safe"), '"safe"');
});
