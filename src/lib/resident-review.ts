import { can } from './access';
import type { Payload, PayloadRequest } from 'payload';
import type { Resident, Submission } from '../payload-types';

export class ReviewError extends Error { constructor(message: string, public status = 400) { super(message); } }
export const normalizeContact = (value: unknown) => String(value ?? '').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
export function possibleMatch(a: {name?: string | null; address?: string | null; email?: string | null; mobile?: string | null}, b: typeof a) {
  return (['name', 'address', 'email', 'mobile'] as const).some(key => {
    const av = normalizeContact(a[key]), bv = normalizeContact(b[key]);
    return Boolean(av && bv && (av === bv || (key === 'mobile' && av.length >= 10 && bv.length >= 10 && av.slice(-10) === bv.slice(-10))));
  });
}
export function approvalFields(s: Submission, current?: Resident, clearFields: string[] = []) {
  return { name: s.name, address: s.address, email: s.email, textGroup: s.textGroup, facebookGroup: s.facebookGroup,
    spouseName: s.spouseName?.trim() || (clearFields.includes('spouseName') ? '' : current?.spouseName ?? ''),
    mobile: s.mobile?.trim() || (clearFields.includes('mobile') ? '' : current?.mobile ?? ''),
    status: current?.status ?? 'active' as const };
}
export async function matchingResidents(payload: Payload, req: PayloadRequest, s: Submission) {
  const records = await payload.find({ collection: 'residents', overrideAccess: false, req, depth: 0, pagination: false });
  return records.docs.filter(r => possibleMatch(s, r));
}
export async function approveResident(payload: Payload, req: PayloadRequest, data: {
  id: string | number; residentID?: string | number; confirm?: boolean; confirmDifferent?: boolean;
  expectedUpdatedAt?: string; residentUpdatedAt?: string; clearFields?: string[];
}) {
  if (!await can(req, 'residents.approve')) throw new ReviewError('Your account cannot approve resident submissions.', 403);
  if (data.confirm !== true) throw new ReviewError('Review and confirm the selected resident first.');
  if (data.clearFields && (!Array.isArray(data.clearFields) || data.clearFields.some(f => !['mobile', 'spouseName'].includes(f)))) throw new ReviewError('Invalid optional field selection.');
  const transaction = await payload.db.beginTransaction();
  if (!transaction) throw new ReviewError('Saving is temporarily unavailable. Please try again.', 503);
  req.transactionID = transaction;
  try {
    // Serialize roster approvals. The temporary unique claim is removed in the same transaction.
    const lock = await payload.create({ collection: 'review-claims', overrideAccess: true, req, data: { submissionID: 'resident-roster-write' } });
    const s = await payload.findByID({ collection: 'submissions', id: data.id, overrideAccess: false, req, depth: 0 });
    if (s.status !== 'pending') throw new ReviewError('This request has already been processed. Refresh to see its current status.', 409);
    if (data.expectedUpdatedAt && s.updatedAt !== data.expectedUpdatedAt) throw new ReviewError('This request changed during your review. Refresh before approving.', 409);
    if (s.requestType === 'update' && !data.residentID) throw new ReviewError('Select the existing resident for this update.');
    const current = data.residentID ? await payload.findByID({ collection: 'residents', id: data.residentID, overrideAccess: false, req, depth: 0 }) : undefined;
    if (current && (!data.residentUpdatedAt || current.updatedAt !== data.residentUpdatedAt)) throw new ReviewError('The resident record changed or has not been compared. Refresh and review it again.', 409);
    if (!current && (await matchingResidents(payload, req, s)).length && data.confirmDifferent !== true) throw new ReviewError('Possible existing residents were found. Select one or confirm this is a different person.');
    await payload.create({ collection: 'review-claims', overrideAccess: true, req, data: { submissionID: String(s.id) } });
    if (current?.status === 'archived') throw new ReviewError('Select an active resident. Archived records cannot receive updates.');
    const fields = approvalFields(s, current, data.clearFields);
    let resident: Resident;
    if (current) {
      const result = await payload.update({ collection: 'residents', overrideAccess: false, req, where: { and: [{ id: { equals: current.id } }, { updatedAt: { equals: current.updatedAt } }] }, data: fields });
      if (result.docs.length !== 1 || result.errors.length) throw new ReviewError('The resident changed. Refresh and compare again.', 409);
      resident = result.docs[0];
    } else resident = await payload.create({ collection: 'residents', overrideAccess: false, req, data: { ...fields, signedUpAt: s.createdAt } });
    await payload.update({ collection: 'submissions', id: s.id, overrideAccess: true, req, data: { status: 'reviewed', resident: resident.id, reviewedAt: new Date().toISOString(), reviewedBy: String(req.user!.id) } });
    await payload.create({ collection: 'audit', overrideAccess: true, req, data: { actor: String(req.user!.id), action: current ? 'approve-update' : 'approve-registration', entity: 'submissions', recordID: String(s.id) } });
    await payload.delete({ collection: 'review-claims', id: lock.id, overrideAccess: true, req });
    await payload.db.commitTransaction(transaction);
    return { residentID: resident.id, message: current ? 'Approved. The resident’s information has been updated.' : 'Approved. This resident has been added to the roster.' };
  } catch (error) {
    await payload.db.rollbackTransaction(transaction);
    if (error instanceof ReviewError) throw error;
    throw new ReviewError('The request could not be saved. Another review may be in progress. Refresh and try again.', 409);
  } finally { delete req.transactionID; }
}
