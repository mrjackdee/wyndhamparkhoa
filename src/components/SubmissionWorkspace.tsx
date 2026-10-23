"use client";
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { Resident, Submission } from '@/payload-types';

type Filter = 'pending' | 'reviewed' | 'archived' | 'all';
type Queue = { docs: Submission[]; totalPages: number; totalDocs: number; counts: Record<Filter, number> };
type Detail = { submission: Submission; matches: Resident[]; related: Submission[] };
const labels: Record<Filter, string> = { pending: 'Needs review', reviewed: 'Approved', archived: 'Archived', all: 'All' };
const date = (value: string) => new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
const status = (s: Submission) => s.status === 'reviewed' ? (s.resident ? 'Approved' : 'Review history unavailable') : s.status === 'archived' ? 'Archived' : 'Needs review';
async function read<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, cache: 'no-store' });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Unable to load records. Check your connection or sign in again.');
  return result;
}
const post = <T,>(data: Record<string, unknown>) => read<T>('/api/resident-review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });

export default function SubmissionWorkspace() {
  const [filter, setFilter] = useState<Filter>('pending');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [queue, setQueue] = useState<Queue | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ filter, q: search, page: String(page) });
    read<Queue>(`/api/resident-review?${params}`, { signal: controller.signal }).then(data => {
      setQueue(data);
      if (data.totalPages && page > data.totalPages) setPage(data.totalPages);
    }).catch(e => { if (!controller.signal.aborted) setError(e.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [filter, search, page, revision]);
  function refresh(message?: string) { setLoading(true); setError(''); setRevision(v => v + 1); if (message) setNotice(message); }
  return <div className="resident-workspace">
    <header className="rw-header"><div><h1 tabIndex={-1} id="resident-workspace-title">Resident Submissions</h1><p>Review new registrations and requested updates before adding them to the resident roster.</p></div><Link className="rw-button secondary" href="/admin/collections/residents">View Resident Roster</Link></header>
    <div className="rw-toolbar"><div className="rw-filters" role="group" aria-label="Submission status">{(Object.keys(labels) as Filter[]).map(key => <button type="button" key={key} aria-pressed={filter === key} onClick={() => { setLoading(true); setError(''); setFilter(key); setPage(1); if (key === filter) setRevision(v => v + 1); }}>{labels[key]} <span>{queue?.counts[key] ?? '–'}</span></button>)}</div>
      <form className="rw-search" onSubmit={e => { e.preventDefault(); setLoading(true); setError(''); setSearch(query.trim()); setPage(1); setRevision(v => v + 1); }}><label htmlFor="submission-search">Search by name, address, or email</label><div><input id="submission-search" value={query} maxLength={200} onChange={e => setQuery(e.target.value)} type="search" /><button className="rw-button secondary" type="submit">Search</button></div></form>
    </div>
    {notice && <p role="status" className="rw-notice">{notice}</p>}
    {error ? <div role="alert" className="rw-notice"><p>{error}</p><button className="rw-button secondary" onClick={() => refresh()}>Try again</button></div> : loading ? <p role="status">Loading submissions…</p> : queue?.docs.length ? <>
      <p className="rw-meta">{queue.totalDocs} request{queue.totalDocs === 1 ? '' : 's'} · Times shown in Eastern Time{filter === 'pending' ? ' · Oldest first' : ''}</p>
      <table className="rw-table"><thead><tr><th>Resident</th><th>Request</th><th>Submitted</th><th>Status</th><th>Action</th></tr></thead><tbody>{queue.docs.map(s => <tr key={s.id}><td data-label="Resident"><strong>{s.name}</strong></td><td data-label="Request">{s.requestType === 'update' ? 'Contact update' : 'New registration'}</td><td data-label="Submitted"><time dateTime={s.createdAt}>{date(s.createdAt)}</time></td><td data-label="Status"><span className={`rw-status ${s.status}`}>{status(s)}</span></td><td><button className="rw-button secondary" aria-label={`Review submission from ${s.name}`} onClick={() => setSelected(s.id)}>Review</button></td></tr>)}</tbody></table>
      <nav className="rw-pagination" aria-label="Submission pages"><button className="rw-button secondary" disabled={page === 1} onClick={() => { setLoading(true); setPage(v => v - 1); }}>Previous</button><span>Page {page} of {queue.totalPages || 1}</span><button className="rw-button secondary" disabled={page >= queue.totalPages} onClick={() => { setLoading(true); setPage(v => v + 1); }}>Next</button></nav>
    </> : <p className="rw-empty">{search ? 'No submissions match your search.' : filter === 'pending' ? 'You’re all caught up. No requests need review.' : 'No submissions in this category.'}</p>}
    {selected !== null && <ReviewDrawer key={selected} id={selected} onClose={() => setSelected(null)} onSaved={refresh} onNext={() => { const next = queue?.docs.find(s => s.id !== selected && s.status === 'pending'); setSelected(next?.id ?? null); }} />}
  </div>;
}

function ReviewDrawer({ id, onClose, onSaved, onNext }: { id: number; onClose: () => void; onSaved: (message?: string) => void; onNext: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [notes, setNotes] = useState('');
  const [savedNotes, setSavedNotes] = useState('');
  const [target, setTarget] = useState('');
  const [results, setResults] = useState<Resident[]>([]);
  const [query, setQuery] = useState('');
  const [clearFields, setClearFields] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [different, setDifferent] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [finished, setFinished] = useState<{ residentID?: number; message: string } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [discard, setDiscard] = useState(false);
  const dirty = notes !== savedNotes;
  useEffect(() => {
    const element = dialog.current; const focus = document.activeElement;
    const overflow = document.body.style.overflow;
    element?.showModal(); document.body.style.overflow = 'hidden';
    return () => { element?.close(); document.body.style.overflow = overflow; if (focus instanceof HTMLElement && focus.isConnected) focus.focus(); else document.getElementById("resident-workspace-title")?.focus(); };
  }, []);
  useEffect(() => {
    let active = true;
    read<Detail>(`/api/resident-review?id=${id}`).then(d => { if (active) { setDetail(d); setNotes(d.submission.notes ?? ''); setSavedNotes(d.submission.notes ?? ''); setResults(d.matches); setError(''); setTarget(''); setConfirmed(false); } }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [id, attempt]);
  useEffect(() => { const warn = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); }; window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn); }, [dirty]);
  const s = detail?.submission;
  const resident = results.find(r => String(r.id) === target);
  const close = () => { if (busy) return; if (dirty) setDiscard(true); else onClose(); };
  async function saveNotes() {
    if (!s || busy) return; setBusy('notes'); setError('');
    try { const result = await post<{ submission: Submission; message: string }>({ action: 'notes', id, notes, expectedUpdatedAt: s.updatedAt }); setDetail(d => d ? { ...d, submission: result.submission } : d); setSavedNotes(notes); setMessage(result.message); onSaved(); } catch (e) { setError((e as Error).message); } finally { setBusy(''); }
  }
  async function searchResidents() {
    if (!query.trim() || busy) return; setBusy('search'); setError('');
    try {
      const params = new URLSearchParams({ depth: '0', limit: '50' });
      ['name', 'address', 'email'].forEach((field, i) => params.set(`where[or][${i}][${field}][contains]`, query.trim()));
      const data = await read<{ docs: Resident[]; hasNextPage: boolean }>(`/api/residents?${params}`);
      setResults(data.docs); setTarget(''); setConfirmed(false);
      setMessage(data.hasNextPage ? 'More than 50 matches. Refine your search to find the right resident.' : data.docs.length ? 'Select the correct resident below.' : 'No residents match this search. Try another name, address, or email.');
    } catch (e) { setError((e as Error).message); } finally { setBusy(''); }
  }
  async function decide(action: 'approve' | 'archive') {
    if (!s || busy || dirty) return; setBusy(action); setError('');
    try {
      const result = await post<{ residentID?: number; message: string }>({ action, id, residentID: target === 'new' ? undefined : target || undefined, residentUpdatedAt: resident?.updatedAt, expectedUpdatedAt: s.updatedAt, clearFields, confirm: confirmed, confirmDifferent: different });
      setFinished(result); onSaved(result.message);
    } catch (e) { setError((e as Error).message); } finally { setBusy(''); }
  }
  const fields = [['name', 'Name'], ['spouseName', 'Spouse name'], ['address', 'Address'], ['mobile', 'Mobile'], ['email', 'Email'], ['textGroup', 'Text messages'], ['facebookGroup', 'Facebook preference']] as const;
  return <dialog ref={dialog} className="rw-drawer" aria-labelledby="review-title" onCancel={e => { e.preventDefault(); close(); }}>
    <div className="rw-drawer-heading"><div><p className="rw-meta">RESIDENT REVIEW</p><h2 id="review-title">{s?.name ?? 'Review submission'}</h2></div><button className="rw-button secondary" onClick={close} disabled={Boolean(busy)} aria-label="Close submission review">Close</button></div>
    {discard ? <div role="alert"><h3>Discard unsaved notes?</h3><p>Your latest notes have not been saved.</p><div className="rw-actions"><button className="rw-button" onClick={() => setDiscard(false)}>Keep editing</button><button className="rw-button secondary" onClick={onClose}>Discard and close</button></div></div> : <>
    {error && <div className="rw-error" role="alert"><p>{error}</p><button className="rw-button secondary" disabled={Boolean(busy) || dirty} onClick={() => { setDetail(null); setAttempt(v => v + 1); }}>Refresh record</button>{dirty && <p>Keep a copy of your unsaved notes before closing and reopening this request.</p>}</div>}
    {finished ? <section><h3>{finished.residentID ? 'Request approved' : 'Request archived'}</h3><p role="status">{finished.message}</p><div className="rw-actions"><button className="rw-button" onClick={onNext}>Review Next Submission</button>{finished.residentID && <Link className="rw-button secondary" href={`/admin/collections/residents/${finished.residentID}`}>View Resident</Link>}</div></section> : !s ? <p role="status">{error ? 'Request unavailable.' : 'Loading request…'}</p> : <>
    <p className="rw-meta">{s.requestType === 'update' ? 'Contact update' : 'New registration'} · {date(s.createdAt)} Eastern Time</p><span className={`rw-status ${s.status}`}>{status(s)}</span>
    <section><h3>Submitted information</h3><dl className="rw-details">{fields.map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{s[key] || 'Not provided'}</dd></div>)}</dl></section>
    {s.status === 'pending' && <>
      <section><h3>Match to the resident roster</h3><p>Possible matches are suggestions. Confirm the person’s identity before applying changes.</p>
      {detail!.related.length > 0 && <div className="rw-notice"><strong>Related pending requests</strong><ul>{detail!.related.map(r => <li key={r.id}><details><summary>{r.name} · {r.requestType === 'update' ? 'Contact update' : 'New registration'} · {date(r.createdAt)}</summary><dl className="rw-details">{fields.map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{r[key] || 'Not provided'}</dd></div>)}</dl></details></li>)}</ul><p>Expand each related request to compare its submitted information before approving. They are not merged automatically.</p></div>}
      <div className="rw-search"><label htmlFor="resident-lookup">Find a resident by name, address, or email</label><div><input id="resident-lookup" value={query} onChange={e => setQuery(e.target.value)} /><button className="rw-button secondary" disabled={Boolean(busy) || !query.trim()} onClick={searchResidents}>{busy === 'search' ? 'Searching…' : 'Search residents'}</button></div></div>
      <fieldset disabled={Boolean(busy)}><legend>Where should this information be saved?</legend>
      {s.requestType !== 'update' && <label className="rw-choice"><input type="radio" name="resident-target" checked={target === 'new'} onChange={() => { setTarget('new'); setConfirmed(false); setDifferent(false); }} />Create a new resident</label>}
      {results.map(r => <label className="rw-choice" key={r.id}><input type="radio" name="resident-target" checked={target === String(r.id)} onChange={() => { setTarget(String(r.id)); setConfirmed(false); setClearFields([]); }} /><span><strong>{r.name}</strong><br />{r.address}<br />{r.email} · {r.mobile || 'No mobile provided'}{r.status === 'archived' ? ' · Archived resident' : ''}</span></label>)}
      {!results.length && <p>No matching residents shown.{s.requestType === 'update' ? ' Search and select an existing resident to approve this update.' : ''}</p>}</fieldset>
      {target === 'new' && detail!.matches.length > 0 && <label className="rw-choice"><input type="checkbox" checked={different} onChange={e => setDifferent(e.target.checked)} />I compared the possible matches. This is a different person and needs a separate resident record.</label>}
      </section>
      {resident && <section><h3>Compare requested changes</h3><p>Approval applies the values below to {resident.name}. Verify the requester using contact information already on file.</p><table className="rw-compare"><thead><tr><th>Field</th><th>Current information</th><th>After approval</th></tr></thead><tbody>{fields.map(([key, label]) => {
        const omitted = (key === 'mobile' || key === 'spouseName') && !s[key]?.trim();
        const value = omitted ? (clearFields.includes(key) ? '' : resident[key]) : s[key];
        const changed = (value ?? '') !== (resident[key] ?? '');
        return <tr key={key} className={changed ? 'changed' : ''}><th>{label}{changed && <small>Changed</small>}</th><td>{resident[key] || 'Not provided'}</td><td>{value || 'Not provided'}{omitted && <><small>Not provided in request. Existing value is kept unless cleared.</small><label className="rw-choice"><input type="checkbox" checked={clearFields.includes(key)} onChange={e => { setClearFields(v => e.target.checked ? [...v, key] : v.filter(f => f !== key)); setConfirmed(false); }} />Clear existing {label.toLowerCase()}</label></>}</td></tr>;
      })}</tbody></table></section>}
    </>}
    <section><h3>Internal review notes</h3><label htmlFor="review-notes">Private notes for the board</label><textarea id="review-notes" rows={5} maxLength={10000} value={notes} onChange={e => setNotes(e.target.value)} /><button className="rw-button secondary" disabled={Boolean(busy) || !dirty} onClick={saveNotes}>{busy === 'notes' ? 'Saving notes…' : 'Save Notes'}</button><p className="rw-meta">Saving notes does not approve this request.</p></section>
    {message && <p role="status" className="rw-notice">{message}</p>}
    {s.status === 'pending' && <div className="rw-decision"><label className="rw-choice"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />I checked the information and confirmed the correct resident.</label>{dirty && <p>Save your notes before approving or archiving.</p>}<div className="rw-actions"><button className="rw-button" disabled={Boolean(busy) || dirty || !target || !confirmed || (target === 'new' && detail!.matches.length > 0 && !different)} onClick={() => decide('approve')}>{busy === 'approve' ? 'Saving approval…' : target && target !== 'new' || s.requestType === 'update' ? 'Approve Update' : 'Approve and Add to Roster'}</button><button className="rw-button secondary" disabled={Boolean(busy) || dirty} onClick={() => decide('archive')}>{busy === 'archive' ? 'Archiving…' : 'Archive without approval'}</button></div><p className="rw-meta">Approval updates contact records only. It does not confirm dues payment, financial standing, or enrollment in external groups.</p></div>}
    </>}
    </>}
  </dialog>;
}
