import { getPayload, createLocalReq, type Where } from 'payload';
import config from '@payload-config';
import { can } from '@/lib/access';
import { sameOrigin } from '@/lib/security';
import { approveResident, matchingResidents, possibleMatch, ReviewError } from '@/lib/resident-review';
const headers = { 'Cache-Control': 'private, no-store' };
async function context(request: Request, write = false) {
  const payload = await getPayload({ config });
  const auth = await payload.auth({ headers: request.headers });
  const req = await createLocalReq({ user: auth.user ?? undefined }, payload);
  if (!await can(req, write ? 'residents.approve' : 'residents.read')) throw new ReviewError('Sign in with an authorized Membership or Administrator account.', 403);
  return { payload, req };
}
function failure(error: unknown) {
  return Response.json({ error: error instanceof ReviewError ? error.message : 'Unable to complete this request. Please try again.' }, { status: error instanceof ReviewError ? error.status : 500, headers });
}
export async function GET(request: Request) {
  try {
    const { payload, req } = await context(request);
    const params = new URL(request.url).searchParams;
    const id = params.get('id');
    if (id) {
      const submission = await payload.findByID({ collection: 'submissions', id, overrideAccess: false, req, depth: 0 });
      const matches = await matchingResidents(payload, req, submission);
      const pending = await payload.find({ collection: 'submissions', where: { status: { equals: 'pending' } }, pagination: false, overrideAccess: false, req, depth: 0 });
      return Response.json({ submission, matches, related: pending.docs.filter(s => String(s.id) !== String(id) && possibleMatch(s, submission)) }, { headers });
    }
    const filter = params.get('filter') ?? 'pending';
    if (!['pending', 'reviewed', 'archived', 'all'].includes(filter)) throw new ReviewError('Choose a valid status filter.');
    const page = Math.max(1, Math.min(100000, Number(params.get('page')) || 1));
    const query = (params.get('q') ?? '').trim().slice(0, 200);
    const approved: Where = { and: [{ status: { equals: 'reviewed' } }, { resident: { exists: true } }] };
    const conditions: Where[] = filter === 'all' ? [] : [filter === 'reviewed' ? approved : { status: { equals: filter } }];
    if (query) conditions.push({ or: ['name', 'address', 'email'].map(field => ({ [field]: { contains: query } })) });
    const [result, pending, reviewed, archived, all] = await Promise.all([
      payload.find({ collection: 'submissions', where: { and: conditions }, page: Math.floor(page), limit: 15, sort: filter === 'pending' ? 'createdAt' : '-createdAt', overrideAccess: false, req, depth: 0 }),
      ...[{ status: { equals: 'pending' } }, approved, { status: { equals: 'archived' } }, {}].map(where => payload.count({ collection: 'submissions', where: where as Where, overrideAccess: false, req })),
    ]);
    return Response.json({ ...result, counts: { pending: pending.totalDocs, reviewed: reviewed.totalDocs, archived: archived.totalDocs, all: all.totalDocs } }, { headers });
  } catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: 'Invalid origin.' }, { status: 403, headers });
  try {
    const { payload, req } = await context(request, true);
    let data;
    try { data = await request.json(); } catch { throw new ReviewError('Invalid request.'); }
    if (!data || !['string', 'number'].includes(typeof data.id)) throw new ReviewError('Select a submission.');
    if (data.action === 'approve') return Response.json(await approveResident(payload, req, data), { headers });
    if (data.action === 'notes') {
      if (typeof data.notes !== 'string' || data.notes.length > 10000) throw new ReviewError('Notes must be 10,000 characters or fewer.');
      // Conditional update avoids overwriting another reviewer’s changes.
      const updated = await payload.update({ collection: 'submissions', overrideAccess: false, req, where: { and: [{ id: { equals: data.id } }, { updatedAt: { equals: data.expectedUpdatedAt } }] }, data: { notes: data.notes } });
      if (!updated.docs.length) throw new ReviewError('This request changed. Refresh to review the latest notes before saving.', 409);
      return Response.json({ submission: updated.docs[0], message: 'Notes saved. Approval status is unchanged.' }, { headers });
    }
    if (data.action === 'archive') {
      const transaction = await payload.db.beginTransaction();
      if (!transaction) throw new ReviewError('Saving is temporarily unavailable.', 503);
      req.transactionID = transaction;
      try {
        const lock = await payload.create({ collection: 'review-claims', overrideAccess: true, req, data: { submissionID: 'resident-roster-write' } });
        const current = await payload.findByID({ collection: 'submissions', id: data.id, overrideAccess: false, req });
        if (current.status !== 'pending' || current.updatedAt !== data.expectedUpdatedAt) throw new ReviewError('This request has changed or has already been processed. Refresh to see its status.', 409);
        await payload.update({ collection: 'submissions', id: data.id, overrideAccess: true, req, data: { status: 'archived' } });
        await payload.delete({ collection: 'review-claims', id: lock.id, overrideAccess: true, req });
        await payload.db.commitTransaction(transaction);
        return Response.json({ message: 'Request archived. The roster was not changed.' }, { headers });
      } catch (error) { await payload.db.rollbackTransaction(transaction); throw error; }
    }
    throw new ReviewError('Unknown action.');
  } catch (error) { return failure(error); }
}
