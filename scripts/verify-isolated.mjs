import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import pg from 'pg';
import { list, del } from '@vercel/blob';
if (!process.env.VERCEL || process.env.VERCEL_ENV !== 'production') throw new Error('Run only in protected Vercel production setup');
const schema = 'wphoa_qa_' + randomBytes(6).toString('hex');
const env = { ...process.env, HOA_QA_SCHEMA: schema, BOOTSTRAP_ADMIN_EMAIL: 'qa-admin@example.invalid', BOOTSTRAP_ADMIN_PASSWORD: randomBytes(32).toString('hex') };
for (const key of ['SMTP_HOST','SMTP_USER','SMTP_PASSWORD','MAIL_FROM','LOCAL_TEST_MODE']) delete env[key];
const run = args => {
 const r = spawnSync(process.execPath,args,{env,stdio:'inherit',timeout:90000});
 if(r.status !== 0) throw new Error('Isolated check failed or timed out');
};
try {
 run(['scripts/migrate-database.mjs']);
 run(['--import','tsx','scripts/seed.ts']);
 run(['--import','tsx','scripts/integration.ts']);
 console.log('Isolated Neon and private Blob integration checks passed.');
} catch { process.exitCode=1; console.error('Isolated verification failed.'); }
finally {
 const client = new pg.Client({connectionString:process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL});
 await client.connect();
 // Only the randomly generated synthetic schema is eligible for removal.
 if(!/^wphoa_qa_[a-f0-9]{12}$/.test(schema)) throw new Error('Cleanup guard');
 await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
 await client.end();
 let cursor;
 do { const result=await list({prefix:'qa/'+schema+'/',cursor});
 if(result.blobs.length) await del(result.blobs.map(b=>b.url));
 cursor=result.hasMore?result.cursor:undefined;
 }while(cursor);
 console.log('Synthetic schema and isolated test uploads removed.');
}
