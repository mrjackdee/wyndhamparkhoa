import { z } from "zod";
import type { Payload } from "payload";
export const feedbackSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  category: z.enum(["issue", "suggestion", "other"]),
  subject: z.string().trim().min(1).max(160),
  message: z.string().trim().min(10).max(5000),
  pageUrl: z
    .string()
    .trim()
    .max(500)
    .refine(
      (v) => !v || /^https?:\/\//i.test(v),
      "Use a complete http or https address, or leave blank.",
    ),
  website: z.literal(""),
  privacy: z.literal("on"),
  token: z.string().max(200),
  idempotencyKey: z.string().uuid(),
});
export type FeedbackAttachment = {
  name: string;
  path: string;
  size: number;
  type: string;
};
export function attachmentType(bytes: Uint8Array): string | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return "image/jpeg";
  if (
    Buffer.from(bytes.subarray(0, 8)).equals(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    )
  )
    return "image/png";
  if (Buffer.from(bytes.subarray(0, 5)).toString() === "%PDF-")
    return "application/pdf";
  return null;
}
export async function notifyFeedback(payload: Payload, id: number | string) {
  const doc = await payload.findByID({
    collection: "feedback",
    id,
    overrideAccess: true,
  });
  if (doc.notification === "sent") return;
  const update = {
    notificationAttempts: (doc.notificationAttempts ?? 0) + 1,
    notificationLastAttempt: new Date().toISOString(),
  };
  try {
    await payload.sendEmail({
      to: "support@wyndhamparkhoa.org",
      subject: "New Wyndham Park website feedback",
      text: `New website feedback has been saved for review. Sign in to HOA Administration: https://www.wyndhamparkhoa.org/admin/collections/feedback/${id}`,
    });
    await payload.update({
      collection: "feedback",
      id,
      overrideAccess: true,
      data: { ...update, notification: "sent" },
    });
  } catch {
    await payload.update({
      collection: "feedback",
      id,
      overrideAccess: true,
      data: { ...update, notification: "failed" },
    });
  }
}
