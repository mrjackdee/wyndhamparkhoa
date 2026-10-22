import { getPayload } from "payload";
import config from "@payload-config";
import { after } from "next/server";
import { put, del } from "@vercel/blob";
import sharp from "sharp";
import { sameOrigin, verifyToken } from "@/lib/security";
import { takeRateSlot } from "@/lib/submission";
import {
  feedbackSchema,
  looksLikeAutomatedFeedback,
  attachmentType,
  notifyFeedback,
  type FeedbackAttachment,
} from "@/lib/feedback";
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json(
      { error: "Please submit from this website." },
      { status: 403 },
    );
  if (Number(request.headers.get("content-length") ?? 0) > 3500000)
    return Response.json(
      { error: "Attachments must total no more than 3 MB." },
      { status: 413 },
    );
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json(
      { error: "The form could not be read." },
      { status: 400 },
    );
  }
  const parsed = feedbackSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return Response.json(
      {
        error:
          "Check your name, email, subject, message (at least 10 characters), category and privacy acknowledgment.",
      },
      { status: 400 },
    );
  const v = parsed.data;
  if (!verifyToken(v.token))
    return Response.json(
      { error: "Please wait a moment and try again.", refreshToken: true },
      { status: 400 },
    );
  if (looksLikeAutomatedFeedback(v.name, v.subject))
    return Response.json(
      { error: "Please enter your name and a short, descriptive subject so the board can review your feedback." },
      { status: 400 },
    );
  const files = form
    .getAll("attachments")
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (
    files.length > 3 ||
    files.reduce((n, f) => n + f.size, 0) > 3 * 1024 * 1024
  )
    return Response.json(
      { error: "Choose up to 3 attachments totaling no more than 3 MB." },
      { status: 400 },
    );
  const uploaded: FeedbackAttachment[] = [];
  let saved = false;
  try {
    const payload = await getPayload({ config });
    const ip =
      request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    if (!(await takeRateSlot(payload, "feedback:" + ip)))
      return Response.json(
        { error: "Too many submissions. Please try again in an hour." },
        { status: 429 },
      );
    const prior = await payload.find({
      collection: "feedback",
      overrideAccess: true,
      where: { idempotencyKey: { equals: v.idempotencyKey } },
      limit: 1,
    });
    if (prior.docs.length) return Response.json({ saved: true });
    for (const file of files) {
      let bytes = Buffer.from(await file.arrayBuffer());
      const type = attachmentType(bytes);
      if (!type) throw new Error("UPLOAD_TYPE");
      if (type.startsWith("image/")) {
        try {
          const img = sharp(bytes, { limitInputPixels: 25000000 });
          bytes =
            type === "image/png"
              ? await img.png().toBuffer()
              : await img.jpeg({ quality: 90 }).toBuffer();
        } catch {
          throw new Error("UPLOAD_TYPE");
        }
      }
      const name =
        file.name.replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 120) ||
        "attachment";
      const blob = await put(`feedback/${v.idempotencyKey}/${name}`, bytes, {
        access: "private",
        addRandomSuffix: true,
        contentType: type,
      });
      uploaded.push({ name, path: blob.pathname, size: bytes.length, type });
    }
    let id: number | string;
    try {
      const doc = await payload.create({
        collection: "feedback",
        overrideAccess: true,
        data: {
          name: v.name,
          email: v.email,
          category: v.category,
          subject: v.subject,
          message: v.message,
          pageUrl: v.pageUrl,
          attachments: uploaded,
          idempotencyKey: v.idempotencyKey,
          privacyAcceptedAt: new Date().toISOString(),
          status: "new",
          notification: "pending",
        },
      });
      id = doc.id;
      saved = true;
    } catch (error) {
      const prior = await payload.count({
        collection: "feedback",
        overrideAccess: true,
        where: { idempotencyKey: { equals: v.idempotencyKey } },
      });
      if (prior.totalDocs) {
        if (uploaded.length) await del(uploaded.map((f) => f.path));
        return Response.json({ saved: true });
      }
      throw error;
    }
    after(async () => {
      try {
        await notifyFeedback(payload, id);
      } catch {
        /* Pending notifications remain retryable. */
      }
    });
    return Response.json({ saved: true }, { status: 201 });
  } catch (error) {
    if (!saved && uploaded.length)
      await del(uploaded.map((f) => f.path)).catch(() => {});
    return Response.json(
      {
        error:
          error instanceof Error && error.message === "UPLOAD_TYPE"
            ? "Use valid JPG, PNG, or PDF attachments only."
            : "Your feedback could not be saved. Your entries are still here. Please try again.",
      },
      {
        status:
          error instanceof Error && error.message === "UPLOAD_TYPE" ? 400 : 503,
      },
    );
  }
}
