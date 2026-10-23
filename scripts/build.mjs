import { spawnSync } from 'node:child_process';
function run(args) { const r=spawnSync(process.execPath,args,{stdio:'inherit',env:process.env});if(r.status!==0)process.exit(r.status??1); }
if(process.env.VERCEL_ENV==='preview'&&!/^wphoa_qa_[a-f0-9]{12}$/.test(process.env.HOA_QA_SCHEMA??'')) throw new Error('Preview must use an isolated synthetic schema.');
run(['scripts/migrate-database.mjs']);
run(['node_modules/next/dist/bin/next','build','--webpack']);
if(process.env.VERCEL_ENV==='preview') run(['--import','tsx','scripts/seed.ts']);
else for(const name of ['publish-meeting-recap','publish-spotlight','publish-meeting-additions']) run(['--import','tsx',`scripts/${name}.ts`]);
