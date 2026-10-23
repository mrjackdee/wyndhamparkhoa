import type { Access, PayloadRequest, Where } from 'payload';
import type { Permission } from './permissions';
import { initialRoles } from './permissions';
export async function permissions(req: PayloadRequest): Promise<{ administrator: boolean; grants: Set<Permission>; active: boolean }> {
  const none = { administrator: false, grants: new Set<Permission>(), active: false };
  if (!req.user?.id) return none;
  const user = await req.payload.findByID({ collection: 'users', id: req.user.id, overrideAccess: true, depth: 0, req });
  if (!user.active) return none;
  // Fresh reads on every authorization check. Never authorize from JWT role claims.
  if (!user.rolesMigrated) {
    const keys: (string | null | undefined)[] = user.role === 'board' ? ['board', 'membership', 'public-relations'] : [user.role];
    return { administrator: user.role === 'administrator', active: true, grants: new Set(initialRoles.filter(r => keys.includes(r.key)).flatMap(r => r.permissions)) };
  }
  const ids = (user.roles ?? []).map(r => typeof r === 'object' ? r.id : r);
  if (!ids.length) return none;
  const roles = await req.payload.find({ collection: 'roles', where: { id: { in: ids } }, overrideAccess: true, depth: 0, pagination: false, req });
  return { administrator: roles.docs.some(r => r.key === 'administrator'), active: roles.docs.length > 0, grants: new Set(roles.docs.flatMap(r => r.permissions ?? [])) };
}
export async function can(req: PayloadRequest, permission: Permission) { const p = await permissions(req); return p.administrator || p.grants.has(permission); }
export const permit = (permission: Permission): Access => async ({ req }) => can(req, permission);
// Compatibility for administrator-only controls. Other capabilities use can().
export async function role(req: PayloadRequest) { const p = await permissions(req); return p.administrator ? 'administrator' : p.active ? 'editor' : null; }
export const admin: Access = async ({ req }) => (await permissions(req)).administrator;
export const staff = permit('content.manage');
export const residentManager = permit('residents.read');
export const published: Access = async ({ req }) => await can(req, 'content.manage') ? true : ({ and: [{ _status: { equals: 'published' } }, { archived: { not_equals: true } }] } as Where);
export const publicMedia: Access = async ({ req }) => (await can(req, 'content.manage') || await can(req, 'spotlight.manage')) ? true : { visibility: { equals: 'public' } };
export const nobody: Access = () => false;
