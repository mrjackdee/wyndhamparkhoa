import { getPayload } from "payload";
import config from "@payload-config";
import { signupSchema } from "@/lib/validation";
import { sameOrigin, verifyToken } from "@/lib/security";
import { notifySubmission, takeRateSlot } from "@/lib/submission";
import { after } from "next/server";
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json(
      { error: "Please submit from this website." },
      { status: 403 },
    );
  if (Number(request.headers.get("content-length") ?? 0) > 12000)
    return Response.json(
      { error: "Submission is too large." },
      { status: 413 },
    );
  let raw: unknown;
  try {
    const text = await request.text();
    if (text.length > 12000)
      return Response.json(
        { error: "Submission is too large." },
        { status: 413 },
      );
    raw = JSON.parse(text);
  } catch {
    return Response.json(
      { error: "Check the form and try again." },
      { status: 400 },
    );
  }
  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success)
    return Response.json(
      {
        error: "Please check the highlighted fields.",
        fields: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  const value = parsed.data;
  if (!verifyToken(value.token))
    return Response.json(
      {
        error:
          "Please wait a moment and try again. If this form has been open for two hours, refresh it.",
        refreshToken: true,
      },
      { status: 400 },
    );
  try {
    const payload = await getPayload({ config });
    const allowed = await takeRateSlot(
      payload,
      request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ??
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        "unknown",
    );
    if (!allowed)
      return Response.json(
        { error: "Too many requests. Please try again in an hour." },
        { status: 429 },
      );
    const prior = await payload.find({
      collection: "submissions",
      where: { idempotencyKey: { equals: value.idempotencyKey } },
      overrideAccess: true,
      limit: 1,
    });
    if (prior.docs.length) return Response.json({ saved: true });
    const {
      name,
      spouseName,
      address,
      mobile,
      email,
      textGroup,
      facebookGroup,
      requestType,
      idempotencyKey,
    } = value;
    let id: number | string;
    try {
      const doc = await payload.create({
        collection: "submissions",
        overrideAccess: true,
        data: {
          name,
          spouseName,
          address,
          mobile,
          email,
          textGroup,
          facebookGroup,
          requestType,
          idempotencyKey,
          privacyAcceptedAt: new Date().toISOString(),
          status: "pending",
          notification: "pending",
        },
      });
      id = doc.id;
    } catch (error) {
      const duplicate = await payload.count({
        collection: "submissions",
        overrideAccess: true,
        where: { idempotencyKey: { equals: idempotencyKey } },
      });
      if (duplicate.totalDocs) return Response.json({ saved: true });
      throw error;
    }
    after(async () => {
      try {
        await notifySubmission(payload, id);
      } catch {
        /* Persisted pending status remains retryable. Never log personal data. */
      }
    });
    return Response.json({ saved: true }, { status: 201 });
  } catch {
    return Response.json(
      {
        error:
          "We could not save your submission. Your entries are still here. Please try again later or contact the HOA.",
      },
      { status: 503 },
    );
  }
}
