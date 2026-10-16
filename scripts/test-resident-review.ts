import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { getPayload } from "payload";
import config from "../src/payload.config";
import { POST } from "../src/app/api/admin-tools/route";
if (process.env.LOCAL_TEST_MODE !== "true" || process.env.VERCEL || process.env.TEST_DATABASE_URL !== "file:./review-qa.db") throw new Error("Isolated local test database required");
const payload=await getPayload({config});
const login=await payload.login({collection:"users",data:{email:"admin@example.invalid",password:"synthetic-local-test-password"}});
const call=(data:object, token=login.token, origin="http://localhost:3000")=>POST(new Request(`${origin}/api/admin-tools`,{method:"POST",headers:{origin,"content-type":"application/json",cookie:`payload-token=${token??""}`},body:JSON.stringify(data)}));
const contact={name:"Synthetic approval",address:"123 Synthetic Lane",email:"synthetic@example.invalid",textGroup:"no" as const,facebookGroup:"yes" as const};
const submission=await payload.create({collection:"submissions",data:{...contact,requestType:"new",status:"pending",idempotencyKey:randomUUID(),privacyAcceptedAt:new Date().toISOString()}});
try {
 for (const origin of ["https://www.wyndhamparkhoa.org", "https://wyndhamparkhoa.org", "https://wyndhamparkhoa.vercel.app"]) {
  const response=await call({action:"duplicates",id:submission.id},login.token,origin);
  assert.equal(response.status,200,`Cookie authentication failed for ${origin}: ${await response.text()}`);
 }
 assert.equal((await call({action:"duplicates",id:submission.id},login.token,"https://untrusted.example")).status,403);
 assert.equal((await call({action:"review",id:submission.id,confirm:true},"invalid")).status,403);
 assert.equal((await call({action:"review",id:submission.id,confirm:false})).status,400);
 const approved=await call({action:"review",id:submission.id,confirm:true});assert.equal(approved.status,200,await approved.text());
 const saved=await payload.findByID({collection:"submissions",id:submission.id});assert.equal(saved.status,"reviewed");assert.ok(saved.resident);
 assert.equal((await call({action:"review",id:submission.id,confirm:true})).status,400);
 const exported=await call({action:"export-xlsx"});assert.equal(exported.status,200);assert.match(exported.headers.get("content-type")??"",/spreadsheetml/);assert.ok((await exported.arrayBuffer()).byteLength>1000);
 assert.equal((await call({action:"export-xlsx"},"invalid")).status,403);
 console.log("PASS: approval saves resident, rejects repeat approval and missing confirmation; private Excel export succeeds and rejects anonymous access");
} finally {await payload.destroy();}
