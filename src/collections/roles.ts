import type { CollectionConfig } from 'payload';
import { admin } from '../lib/access';
import { permissionLabels } from '../lib/permissions';
export const Roles: CollectionConfig = {
  slug: 'roles', admin: { useAsTitle: 'name', group: 'Access', description: 'Assign one or more roles to each user. Permissions combine. Administrator always has full access.' },
  access: { create: admin, read: admin, update: admin, delete: () => false },
  fields: [
    { name: 'name', type: 'text', required: true, unique: true },
    { name: 'key', type: 'text', unique: true, admin: { hidden: true }, access: { create: () => false, update: () => false } },
    { name: 'permissions', type: 'select', hasMany: true, options: Object.entries(permissionLabels).map(([value,label]) => ({ value,label })), admin: { description: 'Select only the permissions this team needs. Only Administrators can change these settings.' } },
  ],
  hooks: { afterChange: [async ({ req, doc, previousDoc }) => {
    await req.payload.create({ collection: 'audit', overrideAccess: true, req, data: { actor: String(req.user?.id ?? 'system'), action: 'role-permissions-changed', entity: 'roles', recordID: String(doc.id), details: { before: previousDoc?.permissions ?? [], after: doc.permissions ?? [] } } });
    return doc;
  }] },
};
