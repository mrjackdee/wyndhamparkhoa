import type { PayloadRequest } from 'payload';
import type { User } from '../payload-types';
type Account = Partial<User>;
export async function accountIsAdmin(req: PayloadRequest, user: Account) {
  if (!user.active) return false;
  if (!user.rolesMigrated) return user.role === 'administrator';
  const ids = (user.roles ?? []).map(r => typeof r === 'object' ? r.id : r);
  if (!ids.length) return false;
  const r = await req.payload.count({ collection: 'roles', overrideAccess: true, req, where: { and: [{ id: { in: ids } }, { key: { equals: 'administrator' } }] } });
  return r.totalDocs > 0;
}
export async function guardAccount(req: PayloadRequest, original: Account | undefined, next: Account | undefined) {
  // Payload wraps writes and these hooks in one transaction. Unique claim serializes security changes.
  if (!req.transactionID) throw new Error('Account changes require a transaction. Please retry.');
  const lock = await req.payload.create({ collection: 'review-claims', overrideAccess: true, req, data: { submissionID: 'user-security-write' } });
  req.context.userSecurityLock = lock.id;
  if (original && await accountIsAdmin(req, original) && (!next || !await accountIsAdmin(req, next))) {
    const users = await req.payload.find({ collection: 'users', overrideAccess: true, req, depth: 0, pagination: false, where: { active: { equals: true } } });
    let others = 0;
    for (const u of users.docs) if (u.id !== original.id && await accountIsAdmin(req, u)) others++;
    if (!others) throw new Error('Keep at least one active Administrator. Assign another Administrator first.');
  }
}
export async function releaseAccount(req: PayloadRequest) {
  const id = req.context.userSecurityLock;
  if (typeof id === 'number' || typeof id === 'string') {
    await req.payload.delete({ collection: 'review-claims', id, overrideAccess: true, req });
    delete req.context.userSecurityLock;
  }
}
