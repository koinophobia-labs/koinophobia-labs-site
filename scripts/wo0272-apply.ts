// Authorized WO-0272 lead refresh only. Default is a read-only plan/readback.
// No sends, no payment mutations, no schema changes, no private console output.
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,existsSync,statfsSync} from 'node:fs';
import {homedir} from 'node:os';
import {join,resolve} from 'node:path';
import {Pool} from 'pg';
import {transaction} from '../lib/team/db';
import {importRecheck} from '../lib/team/recheck-import';
import type {Partner} from '../lib/team/types';
import type {Audit} from '@koinophobia/site-auditor/model';
const root='/Volumes/KoiArchive/WO-0272',privateRoot=join(root,'private');
const dir=join(privateRoot,'portal-final'),apply=process.argv.includes('--apply');
const deadline=Date.parse('2026-11-11T14:30:00Z');
const hash=(text:string)=>createHash('sha256').update(text).digest('hex');
const json=(file:string)=>JSON.parse(readFileSync(file,'utf8'));
const original=json(join(homedir(),'SalesPrivate/leadgen/WO-0272/portal-recheck/cohort.json')) as {partner_id:string}[];
const partners=[...new Set(original.map(r=>r.partner_id))];if(partners.length!==1)throw Error('Ambiguous target cohort');
const target=partners[0];
const cohort=json(join(dir,'cohort.json')) as {id:string;partner_id:string;website:string}[];
const targetRows=cohort.filter(r=>r.partner_id===target);
const plan=json(join(dir,'apply-plan.json')) as {entries:{index:number;file:string;sha256:string}[]};
if(plan.entries.length!==targetRows.length)throw Error('Incomplete reviewed cohort');
const prepared=plan.entries.map(entry=>{
 const row=cohort[entry.index],file=resolve(dir,entry.file);
 if(!row||row.partner_id!==target||!file.startsWith(dir+'/prepared/'))throw Error('Plan scope mismatch');
 const raw=readFileSync(file,'utf8');if(hash(raw)!==entry.sha256)throw Error('Reviewed audit changed');
 return {row,audit:JSON.parse(raw) as Audit};
});
if(new Set(prepared.map(x=>x.row.id)).size!==targetRows.length)throw Error('Duplicate plan target');
let db:Pool|undefined;
try{
 const fs=statfsSync(privateRoot);if(fs.bavail*fs.bsize<10_100_000_000)throw Error('Archive headroom');
 if(apply){
  if(Date.now()>=deadline)throw Error('Deadline passed');
  const receipt=json(join(root,'evidence/release-verified.json'));
  const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
  if(receipt.verification_passed!==true||receipt.git_sha!==sha||Date.now()-Date.parse(receipt.at)>900_000)throw Error('Verified release receipt missing or stale');
  const cli='/Users/koi/.npm/_npx/69f9afb961c37556/node_modules/vercel/dist/vc.js';
  const result=JSON.parse(execFileSync(process.execPath,[cli,'api','/v4/aliases/koinophobialabs.com?teamId=team_GrnNjNAupVBmY91WucyLJOoV','--method','GET'],{encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:30000}));
  if(result.deploymentId!==receipt.live_deployment)throw Error('Production moved after verification');
 }
 const connection=execFileSync(process.execPath,[join(homedir(),'.npm/_npx/74274893b9fe65d3/node_modules/neonctl/bin/cli.js'),'connection-string','br-still-lake-atr1qw2c','--project-id','crimson-frog-18448293','--role-name','neondb_owner','--database-name','neondb','--ssl','require'],{encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:30000}).trim();
 const parsed=new URL(connection);if(parsed.hostname.split('.')[0]!=='ep-billowing-haze-atbq2s9a'||parsed.pathname!=='/neondb')throw Error('Database identity');
 db=new Pool({connectionString:connection,max:2,application_name:'WO-0272-reviewed-refresh',connectionTimeoutMillis:10000,statement_timeout:30000});db.on('error',()=>{});
 const identity=(await db.query('select current_database() db,current_user role,pg_is_in_recovery() recovery')).rows[0];if(identity.db!=='neondb'||identity.role!=='neondb_owner'||identity.recovery)throw Error('Database identity');
 const live=(await db.query('select id,partner_id,website,data from team_leads where partner_id=$1 order by id',[target])).rows;
 const newRows=live.filter(r=>!targetRows.some(t=>t.id===r.id));
 const summary={reviewed:prepared.length,current_target_leads:live.length,added_since_audit:newRows.length,mode:apply?'apply':'read-only'};
 if(!apply){console.log(JSON.stringify(summary));}
 else{
  if(newRows.length)throw Error('New target leads require audit before apply');
  const stamp=Date.now();const backup=join(dir,`database-before-${stamp}.json`);
  if(existsSync(join(dir,'applied-receipt.json')))throw Error('Batch already applied');
  const counts={updated:0,confirmed:0,failed:0,replayed:0};
  await transaction(async q=>{
   const actor=(await q.query("select * from team_partners where active and role='owner' order by id limit 1")).rows[0] as Partner|undefined;
   if(!actor)throw Error('Owner context unavailable');
   const locked=(await q.query('select id,partner_id,website,data from team_leads where partner_id=$1 order by id for update',[target])).rows;
   if(locked.length!==targetRows.length||locked.some(r=>!prepared.some(p=>p.row.id===r.id&&p.row.website===r.website)))throw Error('Target changed');
   writeFileSync(backup,JSON.stringify(locked),{mode:0o600,flag:'wx'});
   for(const item of prepared){
    if(Date.now()>=deadline)throw Error('Deadline passed during transaction');
    const result=await importRecheck(q,actor,item.row.id,item.audit);counts.updated+=result.updated;counts.replayed+=Number(result.replayed);counts[result.confirmed?'confirmed':'failed']++;
    const before=locked.find(r=>r.id===item.row.id)!.data;
    const after=(await q.query('select data from team_leads where id=$1',[item.row.id])).rows[0].data;
    const unrelated=(v:Record<string,unknown>)=>Object.fromEntries(Object.entries(v).filter(([k])=>!['recheck','evidence','opener','leverage_score'].includes(k)));
    if(JSON.stringify(unrelated(before))!==JSON.stringify(unrelated(after)))throw Error('Unrelated lead fields changed');
   }
  },db);
  const readback=(await db.query("select data->'recheck'->>'status' status,count(*)::int count from team_leads where partner_id=$1 and data->'recheck'->>'work_order'='WO-0272' group by 1",[target])).rows;
  const receipt={at:new Date().toISOString(),...summary,...counts,readback};
  writeFileSync(join(dir,'applied-receipt.json'),JSON.stringify(receipt),{mode:0o600,flag:'wx'});
  writeFileSync(join(root,'evidence/lead-update-counts.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(receipt));
 }
}catch{console.error('WO-0272 data operation stopped; private evidence retained and provider details withheld.');process.exitCode=1;}
finally{await db?.end().catch(()=>{});}
