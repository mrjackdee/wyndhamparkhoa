import type { Access, PayloadRequest, Where } from "payload";
export async function role(
  req: PayloadRequest,
): Promise<"administrator" | "editor" | null> {
  if (!req.user?.id) return null;
  const user = await req.payload.findByID({
    collection: "users",
    id: req.user.id,
    overrideAccess: true,
    depth: 0,
    req,
  });
  return user.active ? user.role : null;
}
export const admin: Access = async ({ req }) =>
  (await role(req)) === "administrator";
export const staff: Access = async ({ req }) => Boolean(await role(req));
export const published: Access = async ({ req }) =>
  (await role(req))
    ? true
    : ({
        and: [
          { _status: { equals: "published" } },
          { archived: { not_equals: true } },
        ],
      } as Where);
export const publicMedia: Access = async ({ req }) =>
  (await role(req)) ? true : { visibility: { equals: "public" } };
export const nobody: Access = () => false;
