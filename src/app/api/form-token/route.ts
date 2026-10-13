import { formToken } from "@/lib/security";
export const dynamic = "force-dynamic";
export async function GET() {
  return Response.json(
    { token: formToken() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
