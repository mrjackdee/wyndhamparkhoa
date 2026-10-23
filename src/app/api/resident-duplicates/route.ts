import { getPayload, createLocalReq } from 'payload';
import config from '@payload-config';
import { can } from '@/lib/access';
import { sameOrigin } from '@/lib/security';
import { duplicatePairs, reconcile } from '@/lib/reconcile';
import { ReviewError } from '@/lib/resident-review';
const headers = { 'Cache-Control': 'private, no-store' };
async function context(request: Request) {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: request.headers });
  const req = await createLocalReq({ user: user ?? undefined }, payload);
  if (!await can(req, 'residents.reconcile')) throw new ReviewError('Your account cannot review duplicate records.', 403);
  return { payload, req };
}
function fail(e: unknown) { return Response.json({ error: e instanceof ReviewError ? e.message : 'Unable to load or save this review. Please try again.' }, { status: e instanceof ReviewError ? e.status : 500, headers }); }
export async function GET(request: Request) {
  try {
    const { payload, req } = await context(request);
    const params = new URL(request.url).searchParams;
    if (params.has('a') && params.has('b')) {
      const a = await payload.findByID({ collection: 'residents', id: params.get('a')!, depth: 0, overrideAccess: false, req });
      const b = await payload.findByID({ collection: 'residents', id: params.get('b')!, depth: 0, overrideAccess: false, req });
      const submissions = await payload.find({ collection: 'submissions', where: { resident: { in: [a.id,b.id] } }, pagination: false, depth: 0, overrideAccess: false, req });
      const history = await payload.find({ collection: 'reconciliations', where: { or: [{ source: { in: [a.id,b.id] } }, { target: { in: [a.id,b.id] } }] }, pagination: false, depth: 0, overrideAccess: false, req });
      return Response.json({ a,b,submissions: submissions.docs,history: history.docs }, { headers });
    }
    const result = await duplicatePairs(payload, req);
    const page = Math.max(1, Math.floor(Number(params.get('page')) || 1));
    return Response.json({ pairs: result.pairs.slice((page-1)*15,page*15), total: result.pairs.length, page, history: result.history.filter(h => h.decision === 'merged').map(h => ({id:h.id,decision:h.decision,source:h.source,target:h.target,actor:h.actor,reason:h.reason,createdAt:h.createdAt})) }, { headers });
  } catch (e) { return fail(e); }
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: 'Please use the HOA website.' }, { status: 403, headers });
  try {
    const {payload,req} = await context(request);
    const raw = await request.text();
    if (raw.length > 16000) throw new ReviewError('Review notes are too long.');
    const data = JSON.parse(raw);
    if (!['merge','separate','recover'].includes(data.action)) throw new ReviewError('Choose a supported review action.');
    return Response.json(await reconcile(payload,req,data), { headers });
  } catch (e) { return fail(e); }
}
