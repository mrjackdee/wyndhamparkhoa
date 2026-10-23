import type { Payload, PayloadRequest } from 'payload';
import type { Resident, Submission } from '../payload-types';
import { can } from './access';
import { ReviewError, possibleMatch } from './resident-review';
export const mergeFields = ['name', 'spouseName', 'address', 'mobile', 'email', 'textGroup', 'facebookGroup'] as const;
export type MergeField = typeof mergeFields[number];
type Snapshot = { source: Resident; target: Resident; submissions: Submission[] };
type Versions = { source: string; target: string; submissions: { id: number; updatedAt: string }[] };
export async function duplicatePairs(payload: Payload, req: PayloadRequest) {
  const residents = await payload.find({ collection: 'residents', where: { status: { equals: 'active' } }, pagination: false, depth: 0, overrideAccess: false, req });
  const reviews = await payload.find({ collection: 'reconciliations', pagination: false, depth: 0, overrideAccess: false, req });
  const pairs: { a: Resident; b: Resident }[] = [];
  for (let i = 0; i < residents.docs.length; i++) for (let j = i + 1; j < residents.docs.length; j++) {
    const a = residents.docs[i], b = residents.docs[j];
    if (!possibleMatch(a, b)) continue;
    const kept = reviews.docs.some(r => {
      const snap = r.snapshot as unknown as Snapshot;
      return r.decision === 'separate' && snap && ((snap.source.id === a.id && snap.source.updatedAt === a.updatedAt && snap.target.id === b.id && snap.target.updatedAt === b.updatedAt) || (snap.source.id === b.id && snap.source.updatedAt === b.updatedAt && snap.target.id === a.id && snap.target.updatedAt === a.updatedAt));
    });
    if (!kept) pairs.push({ a, b });
  }
  return { pairs, history: reviews.docs };
}
function contact(r: Resident) { return Object.fromEntries(mergeFields.map(k => [k, r[k] ?? ''])) as Pick<Resident, MergeField>; }
export async function reconcile(payload: Payload, req: PayloadRequest, data: {
  action: 'separate' | 'merge' | 'recover'; sourceID?: number; targetID?: number; reviewID?: number;
  sourceVersion?: string; targetVersion?: string; choices?: Partial<Record<MergeField, 'source' | 'target'>>; reason?: string; confirm?: boolean;
}) {
  if (!await can(req, 'residents.reconcile')) throw new ReviewError('Your account cannot reconcile resident records.', 403);
  if (!data.confirm || typeof data.reason !== 'string' || data.reason.trim().length < 10 || data.reason.length > 10000) throw new ReviewError('Confirm your review and document the reason (at least 10 characters).');
  const tx = await payload.db.beginTransaction();
  if (!tx) throw new ReviewError('Saving is temporarily unavailable.', 503);
  req.transactionID = tx;
  try {
    const lock = await payload.create({ collection: 'review-claims', overrideAccess: true, req, data: { submissionID: 'resident-roster-write' } });
    const read = (id: number) => payload.findByID({ collection: 'residents', id, overrideAccess: false, req, depth: 0 });
    const update = async (r: Resident, fields: Partial<Resident>) => {
      const result = await payload.update({ collection: 'residents', req, overrideAccess: true, where: { and: [{ id: { equals: r.id } }, { updatedAt: { equals: r.updatedAt } }] }, data: fields });
      if (result.docs.length !== 1 || result.errors.length) throw new ReviewError('A resident changed during this review. Refresh and compare again.', 409);
      return result.docs[0];
    };
    const submissions = async (a: number, b: number) => (await payload.find({ collection: 'submissions', overrideAccess: false, req, depth: 0, pagination: false, where: { resident: { in: [a, b] } } })).docs;
    let reviewID: number;
    if (data.action === 'recover') {
      if (!data.reviewID) throw new ReviewError('Select a merge to recover.');
      const review = await payload.findByID({ collection: 'reconciliations', id: data.reviewID, overrideAccess: false, req, depth: 0 });
      if (review.decision !== 'merged') throw new ReviewError('This merge has already been recovered or cannot be recovered.', 409);
      const snap = review.snapshot as unknown as Snapshot, versions = review.resultVersions as unknown as Versions;
      const source = await read(snap.source.id), target = await read(snap.target.id);
      const linked = await submissions(source.id, target.id);
      if (source.updatedAt !== versions.source || target.updatedAt !== versions.target || linked.length !== versions.submissions.length || linked.some(s => !versions.submissions.some(v => v.id === s.id && v.updatedAt === s.updatedAt))) throw new ReviewError('Records changed after this merge. Automatic recovery is blocked to protect newer changes. Ask an Administrator to compare the saved review history and make a documented correction.', 409);
      req.context.restorePreferenceHistory = true;
      for (const [current, before] of [[source, snap.source], [target, snap.target]]) await update(current, { ...contact(before), status: before.status, notes: before.notes, signedUpAt: before.signedUpAt, preferenceHistory: before.preferenceHistory });
      delete req.context.restorePreferenceHistory;
      for (const old of snap.submissions) {
        const current = linked.find(s => s.id === old.id)!;
        const restored = await payload.update({ collection: 'submissions', overrideAccess: true, req, where: { and: [{ id: { equals: old.id } }, { updatedAt: { equals: current.updatedAt } }] }, data: { resident: typeof old.resident === 'object' ? old.resident?.id : old.resident } });
        if (restored.docs.length !== 1) throw new ReviewError('A linked submission changed. Recovery was not applied.', 409);
      }
      await payload.update({ collection: 'reconciliations', id: review.id, overrideAccess: true, req, data: { decision: 'recovered', recoveredAt: new Date().toISOString(), recoveredBy: String(req.user!.id), reason: review.reason + '\nRecovery: ' + data.reason.trim() } });
      reviewID = review.id;
    } else {
      if (!data.sourceID || !data.targetID || data.sourceID === data.targetID) throw new ReviewError('Choose two different residents.');
      const source = await read(data.sourceID), target = await read(data.targetID);
      if (source.status !== 'active' || target.status !== 'active' || source.updatedAt !== data.sourceVersion || target.updatedAt !== data.targetVersion) throw new ReviewError('These records changed. Refresh and compare them again.', 409);
      const linked = await submissions(source.id, target.id);
      const snapshot = { source, target, submissions: linked };
      let resultVersions: Versions | undefined;
      if (data.action === 'merge') {
        const fields = contact(target);
        for (const key of mergeFields) {
          if ((source[key] ?? '') !== (target[key] ?? '') && !['source','target'].includes(data.choices?.[key] ?? '')) throw new ReviewError('Choose which value to retain for every differing field, including communication preferences.');
          if (data.choices?.[key] === 'source') Object.assign(fields, { [key]: source[key] ?? '' });
        }
        if (fields.textGroup === 'yes' && !fields.mobile?.trim()) throw new ReviewError('A mobile number is required when retaining Yes for text messages.');
        const dates = [source.signedUpAt, target.signedUpAt].filter(Boolean).sort() as string[];
        const survivor = await update(target, { ...fields, signedUpAt: dates[0] ?? null });
        const archived = await update(source, { status: 'archived' });
        const versions: Versions['submissions'] = [];
        for (const s of linked) {
          if (s.resident === source.id) {
            const changed = await payload.update({ collection: 'submissions', req, overrideAccess: true, where: { and: [{ id: { equals: s.id } }, { updatedAt: { equals: s.updatedAt } }] }, data: { resident: target.id } });
            if (changed.docs.length !== 1) throw new ReviewError('A linked submission changed. No merge was applied.', 409);
            versions.push({ id: s.id, updatedAt: changed.docs[0].updatedAt });
          } else versions.push({ id: s.id, updatedAt: s.updatedAt });
        }
        resultVersions = { source: archived.updatedAt, target: survivor.updatedAt, submissions: versions };
      }
      const review = await payload.create({ collection: 'reconciliations', overrideAccess: true, req, data: { decision: data.action === 'merge' ? 'merged' : 'separate', source: source.id, target: target.id, actor: String(req.user!.id), reason: data.reason.trim(), snapshot: JSON.parse(JSON.stringify(snapshot)), resultVersions: resultVersions ? JSON.parse(JSON.stringify(resultVersions)) : undefined } });
      reviewID = review.id;
    }
    await payload.create({ collection: 'audit', req, overrideAccess: true, data: { actor: String(req.user!.id), action: 'duplicate-' + data.action, entity: 'reconciliations', recordID: String(reviewID) } });
    await payload.delete({ collection: 'review-claims', id: lock.id, req, overrideAccess: true });
    await payload.db.commitTransaction(tx);
    return { message: data.action === 'recover' ? 'Merge recovered. Original records and links restored.' : data.action === 'merge' ? 'Records merged. The duplicate is archived and the review history is retained.' : 'Records kept separate. They will be suggested again only if their information changes.' };
  } catch (e) {
    await payload.db.rollbackTransaction(tx);
    if (e instanceof ReviewError) throw e;
    throw new ReviewError('The change could not be saved. Refresh and try again. No partial merge was applied.', 409);
  } finally { delete req.transactionID; delete req.context.restorePreferenceHistory; }
}
