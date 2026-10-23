'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Resident, Submission, Reconciliation } from '@/payload-types';
const fields = ['name','spouseName','address','mobile','email','textGroup','facebookGroup'] as const;
const labels = { name:'Name',spouseName:'Spouse name',address:'Address',mobile:'Mobile',email:'Email',textGroup:'Text messages',facebookGroup:'Facebook group' };
const date = (v?: string | null) => v ? new Date(v).toLocaleString('en-US',{timeZone:'America/New_York'}) + ' ET' : 'Not recorded';
type Detail = { a: Resident; b: Resident; submissions: Submission[]; history: Reconciliation[] };
export default function DuplicateWorkspace() {
  const [list,setList] = useState<{pairs:{a:Resident;b:Resident}[];total:number;history:Reconciliation[]}>({pairs:[],total:0,history:[]});
  const [page,setPage] = useState(1), [loading,setLoading] = useState(true), [message,setMessage] = useState(''), [busy,setBusy] = useState(false);
  const [detail,setDetail] = useState<Detail|null>(null), [survivor,setSurvivor] = useState<number>(), [choices,setChoices] = useState<Record<string,'source'|'target'>>({}), [reason,setReason] = useState(''), [confirmed,setConfirmed] = useState(false), [verify,setVerify] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null), origin = useRef<HTMLButtonElement|null>(null), inFlight = useRef(false);
  async function reload() {
    setLoading(true);
    try { const r = await fetch(`/api/resident-duplicates?page=${page}`,{cache:'no-store'}); const d = await r.json(); if(!r.ok) throw Error(d.error); setList(d); }
    catch(e) {setMessage(e instanceof Error ? e.message : 'Unable to load. Please retry.');} finally {setLoading(false);}
  }
  useEffect(()=>{let live=true;fetch(`/api/resident-duplicates?page=${page}`,{cache:'no-store'}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error);if(live)setList(d);}).catch(e=>{if(live)setMessage(e.message);}).finally(()=>{if(live)setLoading(false);});return()=>{live=false;};},[page]);
  function close() {if(busy)return;if(reason && !window.confirm('Discard this unsaved review?'))return;dialog.current?.close();setDetail(null);origin.current?.focus();}
  async function open(a: number,b:number,button:HTMLButtonElement) {
    origin.current=button;setMessage('');
    try {const r=await fetch(`/api/resident-duplicates?a=${a}&b=${b}`,{cache:'no-store'});const d=await r.json();if(!r.ok)throw Error(d.error);setDetail(d);setSurvivor(b);setChoices({});setReason('');setConfirmed(false);setVerify(false);dialog.current?.showModal();}catch(e){setMessage(String(e));}
  }
  async function act(action:'merge'|'separate'|'recover',reviewID?:number) {
    if(inFlight.current)return;
    const recoveryReason=action==='recover'?window.prompt('Reason for recovery. Recovery is blocked if records changed after merging.'):reason;
    if(!recoveryReason)return;
    if(action==='recover'&&!window.confirm('Restore the original records and submission links? Later edits will never be overwritten.'))return;
    inFlight.current=true;setBusy(true);setMessage('');
    const target=detail && (detail.a.id===survivor?detail.a:detail.b), source=detail && (detail.a.id===survivor?detail.b:detail.a);
    try {const r=await fetch('/api/resident-duplicates',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,reviewID,sourceID:source?.id,targetID:target?.id,sourceVersion:source?.updatedAt,targetVersion:target?.updatedAt,choices,reason:recoveryReason,confirm:action==='recover'||confirmed})});const d=await r.json();if(!r.ok)throw Error(d.error);setMessage(d.message);setReason('');dialog.current?.close();setDetail(null);origin.current?.focus();await reload();}catch(e){setMessage(e instanceof Error?e.message:'Saving failed. Please retry.');}finally{inFlight.current=false;setBusy(false);}
  }
  const target=detail && (detail.a.id===survivor?detail.a:detail.b), source=detail && (detail.a.id===survivor?detail.b:detail.a);
  return <main className="resident-workspace rw-workspace"><header><h1>Review Possible Duplicates</h1><p>Compare suggested matches before deciding. Similar names and shared addresses do not mean two records belong to the same person.</p><Link href="/admin/collections/residents">View Resident Roster</Link></header><p role="status">{message}</p>{loading?<p>Loading possible matches…</p>:<><p>{list.total} possible pairs</p>{list.pairs.length?list.pairs.map(({a,b})=><article className="duplicate-pair" key={`${a.id}-${b.id}`}><div><strong>{a.name}</strong><p>{a.address}<br/>{a.email}</p></div><div><strong>{b.name}</strong><p>{b.address}<br/>{b.email}</p></div><button onClick={e=>open(a.id,b.id,e.currentTarget)}>Compare records</button></article>):<p>No possible duplicates found.</p>}<nav aria-label="Duplicate review pages"><button disabled={page===1} onClick={()=>setPage(p=>p-1)}>Previous</button> <span>Page {page}</span> <button disabled={page*15>=list.total} onClick={()=>setPage(p=>p+1)}>Next</button></nav></>}
    <button onClick={reload} disabled={loading}>Refresh list</button>
    <h2>Recent merges and recovery</h2><p>Recovery restores the saved records only if neither resident nor their linked submissions changed afterward. Otherwise ask an Administrator to review the history and make a documented correction.</p>{list.history.map(h=><article key={h.id}><p>Merge #{h.id} · {date(h.createdAt)} · Reviewer {h.actor}</p><p>{h.reason}</p><Link href={`/admin/collections/reconciliations/${h.id}`}>View saved review</Link> <button disabled={busy} onClick={()=>act('recover',h.id)}>Recover merge</button></article>)}
    <dialog ref={dialog} className="rw-drawer rw-dialog" onCancel={e=>{e.preventDefault();close();}}><button type="button" disabled={busy} onClick={close}>Close review</button>{detail&&target&&source&&<><h2>Compare resident records</h2><label>Resident record to keep<select value={survivor} onChange={e=>{setSurvivor(Number(e.target.value));setChoices({});setVerify(false);setConfirmed(false);}}><option value={detail.a.id}>{detail.a.name} · Record {detail.a.id}</option><option value={detail.b.id}>{detail.b.name} · Record {detail.b.id}</option></select></label><p>Keeping record {target.id}. Record {source.id} will be archived only if you confirm a merge.</p>
    <div className="duplicate-fields">{fields.map(k=><fieldset key={k}><legend>{labels[k]} {(source[k]??'')!==(target[k]??'')?'· Different values':'· Same value'}</legend>{(['target','source'] as const).map(side=><label key={side}><input type="radio" name={k} checked={choices[k]===side} onChange={()=>{setChoices(c=>({...c,[k]:side}));setVerify(false);setConfirmed(false);}}/> {side==='target'?'Keep from surviving record':'Use from duplicate'}: <strong>{(side==='target'?target[k]:source[k])||'Not provided'}</strong></label>)}</fieldset>)}</div>
    <p>Original signup dates: surviving record {date(target.signedUpAt)}; duplicate {date(source.signedUpAt)}. The earliest recorded signup date will be retained on the survivor. Both original dates remain in review history.</p>
    <details><summary>Communication preference history</summary>{[target,source].map(r=><div key={r.id}><h3>Record {r.id}: {r.name}</h3>{r.preferenceHistory?.map((h,i)=><p key={i}>{date(h.changedAt)} · Text: {h.textGroup} · Facebook: {h.facebookGroup}</p>)}</div>)}</details>
    <details><summary>Linked submissions and review history</summary>{detail.submissions.map(s=><p key={s.id}><Link href={`/admin/collections/submissions/${s.id}`}>Submission {s.id}</Link> · {s.requestType} · {s.status} · {date(s.createdAt)}</p>)}{detail.history.map(h=><p key={h.id}>{h.decision} · {date(h.createdAt)} · Reviewer {h.actor}: {h.reason}</p>)}</details>
    <label>Decision notes and evidence for communication preferences<textarea value={reason} onChange={e=>{setReason(e.target.value);setVerify(false);setConfirmed(false);}} maxLength={10000}/></label><p>Do not assume consent when preferences conflict. Document which recorded preference or resident confirmation supports your selection.</p>
    <label><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/> I compared both records and documented my decision.</label>
    {verify&&<section className="notice"><h3>Confirm merge</h3><p>Record {target.id} will remain active. Record {source.id} will be archived. Source submissions will link to the survivor and their original links will remain recoverable.</p><dl>{fields.map(k=><div key={k}><dt>{labels[k]}</dt><dd>{(choices[k]==='source'?source[k]:target[k])||'Not provided'}</dd></div>)}</dl></section>}
    <p role="alert">{message}</p><div className="rw-actions"><button disabled={busy||!confirmed||reason.trim().length<10} onClick={()=>act('separate')}>Keep Separate</button>{verify?<button disabled={busy||!confirmed} onClick={()=>act('merge')}>{busy?'Saving…':'Confirm Merge Records'}</button>:<button disabled={busy||!confirmed||reason.trim().length<10||fields.some(k=>(source[k]??'')!==(target[k]??'')&&!choices[k])} onClick={()=>setVerify(true)}>Review Merge Records</button>}</div></> }</dialog>
  </main>;
}
