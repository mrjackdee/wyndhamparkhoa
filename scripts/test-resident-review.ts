import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { getPayload, createLocalReq } from 'payload';
import config from '../src/payload.config';
import { approveResident, matchingResidents, possibleMatch, approvalFields } from '../src/lib/resident-review';
if (process.env.LOCAL_TEST_MODE !== 'true' || process.env.VERCEL || !process.env.TEST_DATABASE_URL?.includes('review-qa')) throw new Error('Isolated review QA database required');
const p = await getPayload({ config });
try {
  const user = await p.create({ collection: 'users', data: { email: `board-${randomUUID()}@example.invalid`, password: randomUUID(), role: 'board', rolesMigrated: false, active: true } });
  const editor = await p.create({ collection: 'users', data: { email: `editor-${randomUUID()}@example.invalid`, password: randomUUID(), role: 'editor', rolesMigrated: false, active: true } });
  const req = await createLocalReq({ user: { ...user, collection: 'users' } }, p);
  const make = (requestType: 'new' | 'update', extra = {}) => p.create({ collection: 'submissions', data: { name: 'Synthetic Resident', address: '123 QA Lane', email: 'synthetic@example.invalid', mobile: '8172350000', textGroup: 'no', facebookGroup: 'yes', requestType, idempotencyKey: randomUUID(), privacyAcceptedAt: new Date().toISOString(), ...extra } });
  const s = await make('new');
  const approved = await approveResident(p, req, { id: s.id, confirm: true, expectedUpdatedAt: s.updatedAt });
  assert.ok(approved.residentID);
  let resident = await p.findByID({ collection: 'residents', id: approved.residentID });
  assert.equal(resident.signedUpAt, s.createdAt);
  assert.equal(resident.preferenceHistory?.length, 1);
  await assert.rejects(() => approveResident(p, req, { id: s.id, confirm: true }));
  assert.equal((await p.count({ collection: 'residents' })).totalDocs, 1);
  console.log('PASS board approval, signup timestamp, preference history, repeat approval protection');
  const update = await make('update', { mobile: '', spouseName: '', textGroup: 'yes' });
  await assert.rejects(() => approveResident(p, req, { id: update.id, confirm: true }));
  await assert.rejects(() => approveResident(p, req, { id: update.id, residentID: resident.id, residentUpdatedAt: 'stale', confirm: true }));
  const updated = await approveResident(p, req, { id: update.id, residentID: resident.id, residentUpdatedAt: resident.updatedAt, confirm: true });
  resident = await p.findByID({ collection: 'residents', id: updated.residentID });
  assert.equal(resident.mobile, '8172350000');
  assert.equal(resident.textGroup, 'yes');
  assert.equal(resident.preferenceHistory?.length, 2);
  assert.equal(resident.signedUpAt, s.createdAt);
  console.log('PASS explicit update target, stale record protection, omitted mobile preservation, timestamp retention');
  const duplicate = await make('new', { name: ' SYNTHETIC resident ', email: 'other@example.invalid' });
  assert.ok((await matchingResidents(p, req, duplicate)).length);
  await assert.rejects(() => approveResident(p, req, { id: duplicate.id, confirm: true }));
  assert.equal((await p.findByID({ collection: 'submissions', id: duplicate.id })).status, 'pending');
  const before = (await p.count({ collection: 'residents' })).totalDocs;
  const originalCreate = p.create.bind(p);
  p.create = (async (args: Parameters<typeof p.create>[0]) => {
    if (args.collection === 'audit' && 'data' in args && (args.data as {action?: string}).action === 'approve-registration') throw new Error('Synthetic storage failure');
    return originalCreate(args);
  }) as typeof p.create;
  await assert.rejects(() => approveResident(p, req, { id: duplicate.id, confirm: true, confirmDifferent: true }));
  p.create = originalCreate;
  assert.equal((await p.count({ collection: 'residents' })).totalDocs, before);
  assert.equal((await p.findByID({ collection: 'submissions', id: duplicate.id })).status, 'pending');
  console.log('PASS duplicate confirmation and atomic rollback on audit storage failure');
  for (const user of [undefined, { ...editor, collection: 'users' as const }]) {
    const denied = await createLocalReq({ user }, p);
    await assert.rejects(() => p.find({ collection: 'submissions', overrideAccess: false, req: denied }));
    await assert.rejects(() => p.find({ collection: 'residents', overrideAccess: false, req: denied }));
    await assert.rejects(() => approveResident(p, denied, { id: duplicate.id, confirm: true, confirmDifferent: true }));
  }
  console.log('PASS editor and visitor read/approval denial');
  assert.ok(possibleMatch({ mobile: '+1 (817) 235-0000' }, { mobile: '8172350000' }));
  assert.ok(!possibleMatch({ name: '' }, { name: '' }));
  assert.equal(approvalFields(update, resident, ['mobile']).mobile, '');
  console.log('PASS normalized phone matching, empty match exclusion, explicit optional clearing');
} finally { await p.destroy(); }

process.exit(0);
