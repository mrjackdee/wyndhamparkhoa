import { getPayload, createLocalReq } from "payload";
import config from "@payload-config";
import { get } from "@vercel/blob";
import { can } from "@/lib/access";
import { sameOrigin } from "@/lib/security";
import { notifyFeedback, type FeedbackAttachment } from "@/lib/feedback";
async function authorized(request: Request) {
  const payload = await getPayload({ config });
  const auth = await payload.auth({ headers: request.headers });
  const req = await createLocalReq({ user: auth.user ?? undefined }, payload);
  return { payload, allowed: await can(req, "feedback.manage") };
}
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, { params }: Context) {
  const { payload, allowed } = await authorized(request);
  if (!allowed) return new Response(null, { status: 403 });
  try {
    const { id } = await params;
    const doc = await payload.findByID({
      collection: "feedback",
      id,
      overrideAccess: true,
    });
    const files = (doc.attachments ?? []) as FeedbackAttachment[];
    const index = new URL(request.url).searchParams.get("attachment");
    if (index === null)
      return Response.json(
        {
          attachments: files.map((f, i) => ({
            name: f.name,
            size: f.size,
            index: i,
          })),
        },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    if (!/^\d+$/.test(index) || !files[Number(index)])
      return new Response(null, { status: 404 });
    const file = files[Number(index)];
    const blob = await get(file.path, { access: "private" });
    if (!blob || blob.statusCode !== 200)
      return new Response(null, { status: 404 });
    return new Response(blob.stream, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${file.name.replace(/[^a-zA-Z0-9._ -]/g, "_")}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
export async function POST(request: Request, { params }: Context) {
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  const { payload, allowed } = await authorized(request);
  if (!allowed) return new Response(null, { status: 403 });
  try {
    const { id } = await params;
    await notifyFeedback(payload, id);
    const doc = await payload.findByID({
      collection: "feedback",
      id,
      overrideAccess: true,
    });
    return Response.json({ sent: doc.notification === "sent" });
  } catch {
    return Response.json(
      { error: "Notification could not be retried." },
      { status: 503 },
    );
  }
}
