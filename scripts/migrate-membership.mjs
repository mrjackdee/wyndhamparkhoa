import { put, get } from '@vercel/blob';
import { createHash } from 'node:crypto';
export async function migrateMembership(client, schema) {
  const q = (sql,params) => client.query(sql.replaceAll('wphoa',schema),params);
  if ((await q("SELECT to_regclass('wphoa.roles') AS t")).rows[0].t) return;
  // Serialize and freeze the affected data before making the durable backup.
  await q('LOCK TABLE wphoa.users, wphoa.residents, wphoa.submissions, wphoa.audit IN SHARE ROW EXCLUSIVE MODE');
  const tables = (await q("SELECT table_name FROM information_schema.tables WHERE table_schema='wphoa' AND table_type='BASE TABLE' ORDER BY table_name")).rows;
  const backup = { format: 'wphoa-before-membership-v1', schema, createdAt: new Date().toISOString(), tables: {} };
  for (const {table_name} of tables) {
    if (!/^[a-z0-9_]+$/.test(table_name)) throw new Error('Unexpected table identifier');
    backup.tables[table_name] = (await q(`SELECT * FROM wphoa."${table_name}"`)).rows;
  }
  const bytes = Buffer.from(JSON.stringify(backup));
  const checksum = createHash('sha256').update(bytes).digest('hex');
  const pathname = `${schema === 'wphoa' ? 'backups' : 'qa/'+schema}/before-membership-${Date.now()}.json`;
  try { await put(pathname,bytes,{access:'private',addRandomSuffix:false,contentType:'application/json'}); } catch(e) { throw Object.assign(new Error('Private backup write failed'), {code:'BACKUP_WRITE_'+e.constructor.name}); }
  let stored;
  try { stored = await get(pathname,{access:'private'}); } catch(e) { throw Object.assign(new Error('Private backup read failed'), {code:'BACKUP_READ_'+e.constructor.name}); }
  if (!stored || stored.statusCode !== 200 || createHash('sha256').update(Buffer.from(await new Response(stored.stream).arrayBuffer())).digest('hex') !== checksum) throw Object.assign(new Error('Backup readback failed'),{code:'BACKUP_CHECKSUM'});
  // No password, hashes, email addresses or resident data are written to logs.
  console.log('Pre-migration private backup verified:', pathname, 'SHA256:', checksum);
  await q(`CREATE TYPE wphoa.enum_roles_permissions AS ENUM ('content.manage','leadership.manage','spotlight.manage','feedback.manage','residents.read','residents.edit','residents.approve','residents.export','residents.reconcile');
    CREATE TYPE wphoa.enum_reconciliations_decision AS ENUM ('separate','merged','recovered');
    CREATE TABLE wphoa.roles (id serial PRIMARY KEY, name varchar NOT NULL UNIQUE, key varchar UNIQUE, updated_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now());
    CREATE TABLE wphoa.roles_permissions ("order" integer NOT NULL, parent_id integer NOT NULL REFERENCES wphoa.roles(id) ON DELETE CASCADE, value wphoa.enum_roles_permissions);
    CREATE INDEX roles_permissions_parent_idx ON wphoa.roles_permissions(parent_id);
    CREATE TABLE wphoa.users_rels (id serial PRIMARY KEY, "order" integer, parent_id integer NOT NULL REFERENCES wphoa.users(id) ON DELETE CASCADE, path varchar NOT NULL, roles_id integer REFERENCES wphoa.roles(id) ON DELETE CASCADE);
    CREATE INDEX users_rels_parent_idx ON wphoa.users_rels(parent_id);
    CREATE INDEX users_rels_path_idx ON wphoa.users_rels(path);
    CREATE INDEX users_rels_roles_id_idx ON wphoa.users_rels(roles_id);
    ALTER TABLE wphoa.users ADD COLUMN roles_migrated boolean DEFAULT false;
    ALTER TABLE wphoa.audit ADD COLUMN IF NOT EXISTS details jsonb;
    ALTER TABLE wphoa.submissions ADD COLUMN IF NOT EXISTS reviewed_at timestamptz, ADD COLUMN IF NOT EXISTS reviewed_by varchar;
    CREATE TABLE wphoa.reconciliations (id serial PRIMARY KEY, decision wphoa.enum_reconciliations_decision NOT NULL, source_id integer NOT NULL REFERENCES wphoa.residents(id), target_id integer NOT NULL REFERENCES wphoa.residents(id), actor varchar NOT NULL, reason varchar NOT NULL, snapshot jsonb, result_versions jsonb, recovered_at timestamptz, recovered_by varchar, updated_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now());
    ALTER TABLE wphoa.payload_locked_documents_rels ADD COLUMN roles_id integer REFERENCES wphoa.roles(id) ON DELETE CASCADE, ADD COLUMN reconciliations_id integer REFERENCES wphoa.reconciliations(id) ON DELETE CASCADE;
    ALTER TABLE wphoa.roles ENABLE ROW LEVEL SECURITY; ALTER TABLE wphoa.roles_permissions ENABLE ROW LEVEL SECURITY; ALTER TABLE wphoa.users_rels ENABLE ROW LEVEL SECURITY; ALTER TABLE wphoa.reconciliations ENABLE ROW LEVEL SECURITY;`);
  const defs = [
    ['Administrator','administrator',[]],
    ['Board Member','board',['leadership.manage','content.manage','feedback.manage']],
    ['Membership','membership',['residents.read','residents.edit','residents.approve','residents.export','residents.reconcile']],
    ['Public Relations','public-relations',['spotlight.manage']],
    ['Content Editor','editor',['content.manage']],
  ];
  const ids = {};
  for (const [name,key,perms] of defs) {
    const id = (await q('INSERT INTO wphoa.roles(name,key) VALUES($1,$2) RETURNING id',[name,key])).rows[0].id;
    ids[key]=id;
    for(let i=0;i<perms.length;i++) await q('INSERT INTO wphoa.roles_permissions("order",parent_id,value) VALUES($1,$2,$3)',[i+1,id,perms[i]]);
  }
  const users = (await q('SELECT id,name,role,active FROM wphoa.users')).rows;
  const verified = new Map();
  for (const name of ['Terry Harrison','Edith Lee']) {
    const matches = users.filter(u => String(u.name??'').trim().toLowerCase() === name.toLowerCase());
    if(matches.length===1) verified.set(matches[0].id,name);
    else console.log('Membership assignment needs account confirmation for:',name,'matching account count:',matches.length);
  }
  for(const user of users) {
    const roles = user.role === 'board' ? ['board','membership','public-relations'] : [user.role];
    if(verified.has(user.id) && !roles.includes('membership')) roles.push('membership');
    for(let i=0;i<roles.length;i++) await q('INSERT INTO wphoa.users_rels("order",parent_id,path,roles_id) VALUES($1,$2,$3,$4)',[i+1,user.id,'roles',ids[roles[i]]]);
    await q('UPDATE wphoa.users SET roles_migrated=true WHERE id=$1',[user.id]);
    await q('INSERT INTO wphoa.audit(actor,action,entity,record_i_d,details) VALUES($1,$2,$3,$4,$5)',['migration','roles-migrated','users',String(user.id),JSON.stringify({legacyRole:user.role,roles,verifiedMembershipName:verified.get(user.id)??null})]);
  }
  await q('ALTER TABLE wphoa.users ALTER COLUMN roles_migrated SET DEFAULT true');
  // Backfill decision metadata only when a matching historical approval audit entry exists.
  await q(`UPDATE wphoa.submissions s SET reviewed_at=a.created_at,reviewed_by=a.actor FROM (SELECT DISTINCT ON(record_i_d) record_i_d,created_at,actor FROM wphoa.audit WHERE entity='submissions' AND action IN ('approve-registration','approve-update','approve') ORDER BY record_i_d,created_at) a WHERE s.id::text=a.record_i_d AND s.status='reviewed' AND s.reviewed_at IS NULL`);
  console.log('Role assignments migrated without changing resident details. Verified Membership accounts:',verified.size);
}
