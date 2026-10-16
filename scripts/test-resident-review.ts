import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { getPayload } from "payload";
import config from "../src/payload.config";
import { POST } from "../src/app/api/admin-tools/route";
if (process.env.LOCAL_TEST_MODE !== "true" || process.env.VERCEL || process.env.TEST_DATABASE_URL !== "file:./review-qa.db") throw new Error("Isolated local test database required");
const payload=await getPayload({config});
const login=await payload.login({collection:"users",data:{email:"admin@example.invalid",password:"synthetic-local-test-password"}});
const board=await payload.create({collection:"users",data:{email:`board-${randomUUID()}@example.invalid`,password:"synthetic-board-password",role:"board",active:true}});
const boardLogin=await payload.login({collection:"users",data:{email:board.email,password:"synthetic-board-password"}});
const editor=await payload.create({collection:"users",data:{email:`editor-${randomUUID()}@example.invalid`,password:"synthetic-editor-password",role:"editor",active:true}});
const editorLogin=await payload.login({collection:"users",data:{email:editor.email,password:"synthetic-editor-password"}});
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
 assert.equal((await call({action:"duplicates",id:submission.id},editorLogin.token)).status,403);
 assert.equal((await call({action:"export-xlsx"},editorLogin.token)).status,403);
 assert.equal((await call({action:"invite",email:"no@example.invalid",role:"administrator"},boardLogin.token)).status,403);
 const approved=await call({action:"review",id:submission.id,confirm:true},boardLogin.token);assert.equal(approved.status,200,await approved.text());
 const saved=await payload.findByID({collection:"submissions",id:submission.id});assert.equal(saved.status,"reviewed");assert.ok(saved.resident);
 assert.equal((await call({action:"review",id:submission.id,confirm:true})).status,400);
 const resident=await payload.findByID({collection:"residents",id:typeof saved.resident === "object" ? saved.resident!.id : saved.resident!});
 assert.equal(resident.signedUpAt,submission.createdAt);
 const exported=await call({action:"export-xlsx"},boardLogin.token);assert.equal(exported.status,200);assert.match(exported.headers.get("content-type")??"",/spreadsheetml/);assert.ok((await exported.arrayBuffer()).byteLength>1000);
 assert.equal((await call({action:"export-xlsx"},"invalid")).status,403);
 await payload.update({collection:"users",id:board.id,data:{active:false}});
 assert.equal((await call({action:"export-xlsx"},boardLogin.token)).status,403);
 console.log("PASS: approval saves resident, rejects repeat approval and missing confirmation; private Excel export succeeds and rejects anonymous access");
} finally {await payload.destroy();}
