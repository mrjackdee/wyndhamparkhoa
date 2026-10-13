import type { Payload } from "payload";
import { digest } from "./security";
export async function takeRateSlot(
  payload: Payload,
  ip: string,
  now = Date.now(),
) {
  await payload.delete({
    collection: "rate-limits",
    overrideAccess: true,
    where: { expiresAt: { less_than: new Date(now).toISOString() } },
  });
  const hour = Math.floor(now / 3600000);
  for (let slot = 0; slot < 5; slot++) {
    const key = digest(ip + ":" + hour + ":" + slot);
    try {
      await payload.create({
        collection: "rate-limits",
        overrideAccess: true,
        data: { key, expiresAt: new Date(now + 7200000).toISOString() },
      });
      return true;
    } catch {
      const exists = await payload.count({
        collection: "rate-limits",
        overrideAccess: true,
        where: { key: { equals: key } },
      });
      if (!exists.totalDocs) throw new Error("Rate limit storage unavailable");
    }
  }
  return false;
}
export async function notifySubmission(payload: Payload, id: number | string) {
  const doc = await payload.findByID({
    collection: "submissions",
    id,
    overrideAccess: true,
  });
  if (doc.notification === "sent") return;
  const attempts = (doc.notificationAttempts ?? 0) + 1;
  try {
    await payload.sendEmail({
      to: "wyndhamparkhoa@yahoo.com",
      subject: "New Wyndham Park resident submission",
      text: `A resident contact submission is ready for review. Sign in securely: ${process.env.NEXT_PUBLIC_SITE_URL}/admin/collections/submissions/${id}`,
    });
    await payload.update({
      collection: "submissions",
      id,
      overrideAccess: true,
      data: {
        notification: "sent",
        notificationAttempts: attempts,
        notificationLastAttempt: new Date().toISOString(),
      },
    });
  } catch {
    await payload.update({
      collection: "submissions",
      id,
      overrideAccess: true,
      data: {
        notification: "failed",
        notificationAttempts: attempts,
        notificationLastAttempt: new Date().toISOString(),
      },
    });
  }
}
