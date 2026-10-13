import config from "@payload-config";
import {
  REST_GET,
  REST_POST,
  REST_DELETE,
  REST_PATCH,
  REST_PUT,
  REST_OPTIONS,
} from "@payloadcms/next/routes";
export const GET = REST_GET(config);
const post = REST_POST(config);
export const POST: typeof post = async (req, context) => {
  const path = new URL(req.url).pathname.replace(/\/+$/, "");
  // No public first-user enrollment or unrestricted public account creation.
  if (path.endsWith("/first-register") || path.endsWith("/create-first-user"))
    return Response.json({ error: "Invitation required." }, { status: 403 });
  return post(req, context);
};
export const DELETE = REST_DELETE(config);
export const PATCH = REST_PATCH(config);
export const PUT = REST_PUT(config);
export const OPTIONS = REST_OPTIONS(config);
