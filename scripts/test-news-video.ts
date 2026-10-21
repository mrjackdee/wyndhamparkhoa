import assert from 'node:assert/strict';
import { getPayload, createLocalReq } from 'payload';
import config from '../src/payload.config';
if (process.env.LOCAL_TEST_MODE !== 'true' || process.env.VERCEL || process.env.DATABASE_URL) throw new Error('Local synthetic data only.');
const p=await getPayload({config});
try {
 const user=await p.create({collection:'users',data:{email:`video-qa-${Date.now()}@example.invalid`,password:'synthetic-only-password',role:'board',active:true}});
 const req=await createLocalReq({user:{...user,collection:'users'}},p);
 const video=await p.create({collection:'media',overrideAccess:false,req,filePath:'assets/meeting-2026-10-17-additions/community-meeting-silent.mp4',data:{title:'Synthetic test video',category:'video',source:'Local QA using owner-approved silent file',visibility:'private'}});
 const story=await p.create({collection:'news',overrideAccess:false,req,draft:true,data:{title:'Synthetic video story',summary:'Local QA',body:'Local QA',source:'Synthetic test',kind:'announcement',video:video.id,videoDescription:'A silent thank-you presentation.',_status:'draft'}});
 assert.equal((await p.find({collection:'media',overrideAccess:false,where:{id:{equals:video.id}}})).totalDocs,0);
 await assert.rejects(()=>p.update({collection:'news',id:story.id,req,overrideAccess:false,data:{_status:'published'}}));
 await p.update({collection:'news',id:story.id,req,overrideAccess:false,data:{videoApproved:true,_status:'published'}});
 const saved=await p.findByID({collection:'news',id:story.id,overrideAccess:false,depth:1});
 assert.equal(typeof saved.video==='object' && saved.video?.visibility,'public');
 console.log('PASS board: private video draft, approval required, published video relationship and public media');
} finally {await p.destroy();}
process.exit(0);
