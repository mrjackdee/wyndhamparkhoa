import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
export function digest(value: string) {
  if (!process.env.PAYLOAD_SECRET) throw new Error("Missing signing secret");
  return createHmac("sha256", process.env.PAYLOAD_SECRET)
    .update(value)
    .digest("hex");
}
export function formToken() {
  const body = Date.now() + "." + randomUUID();
  return body + "." + digest(body);
}
export function verifyToken(token: string, now = Date.now()) {
  const [time, id, signature] = token.split(".");
  if (!time || !id || !signature || signature.length !== 64) return false;
  const expected = digest(time + "." + id);
  return (
    /^[a-f0-9]+$/.test(signature) &&
    timingSafeEqual(Buffer.from(signature), Buffer.from(expected)) &&
    now - Number(time) >= 1500 &&
    now - Number(time) < 7200000
  );
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return Boolean(origin && origin === new URL(request.url).origin);
}
