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
async function main(){
const root='/Volumes/KoiArchive/WO-0272',privateRoot=join(root,'private');
const dir=join(privateRoot,'portal-final'),apply=process.argv.includes('--apply');
const deadline=Date.parse('2026-11-11T14:30:00Z');
const hash=(text:string)=>createHash('sha256').update(text).digest('hex');
const json=(file:string)=>JSON.parse(readFileSync(file,'utf8'));
const original=json(join(homedir(),'SalesPrivate/leadgen/WO-0272/portal-recheck/cohort.json')) as {partner_id:string}[];
const partners=[...new Set(original.map(r=>r.partner_id))];if(partners.length!==1)throw Error('Ambiguous target cohort');
const target=partners[0];
const planFile=process.env.PLAN_FILE??'apply-plan.json';if(!/^apply-plan(?:-[a-z0-9-]+)?\.json$/.test(planFile))throw Error('Invalid plan file');
const planRaw=readFileSync(join(dir,planFile),'utf8');
const planSha=hash(planRaw),receiptFile=planFile.replace('apply-plan','applied-receipt'),countsFile=planFile.replace('apply-plan','lead-update-counts');
const plan=JSON.parse(planRaw) as {cohort_file:string;cohort_sha256:string;entries:{index:number;file:string;sha256:string}[]};
if(!/^cohort(?:-[a-z0-9-]+)?\.json$/.test(plan.cohort_file))throw Error('Invalid cohort file');
const cohortRaw=readFileSync(join(dir,plan.cohort_file),'utf8');if(hash(cohortRaw)!==plan.cohort_sha256)throw Error('Reviewed cohort changed');
const cohort=JSON.parse(cohortRaw) as {id:string;partner_id:string;website:string}[];
const targetRows=cohort.filter(r=>r.partner_id===target);
if(plan.entries.length!==targetRows.length)throw Error('Incomplete reviewed cohort');
const prepared=plan.entries.map(entry=>{
 const row=cohort[entry.index],file=resolve(dir,entry.file);
 if(!row||row.partner_id!==target||!file.startsWith(dir+'/prepared/'))throw Error('Plan scope mismatch');
 const raw=readFileSync(file,'utf8');if(hash(raw)!==entry.sha256)throw Error('Reviewed audit changed');
 return {row,audit:JSON.parse(raw) as Audit};
});
if(new Set(prepared.map(x=>x.row.id)).size!==targetRows.length)throw Error('Duplicate plan target');
let db:Pool|undefined;let phase='preflight';
try{
 const fs=statfsSync(privateRoot);if(fs.bavail*fs.bsize<10_100_000_000)throw Error('Archive headroom');
 if(apply){
  if(existsSync(join(root,'evidence',countsFile)))throw Error('Count receipt already exists');
  if(Date.now()>=deadline-120_000)throw Error('Insufficient transaction deadline reserve');
  const receipt=json(join(root,'evidence/release-verified.json'));
  const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
  if(receipt.verification_passed!==true||receipt.git_sha!==sha||Date.now()-Date.parse(receipt.at)>900_000)throw Error('Verified release receipt missing or stale');
  const cli='/Users/koi/.npm/_npx/69f9afb961c37556/node_modules/vercel/dist/vc.js';
  const result=JSON.parse(execFileSync(process.execPath,[cli,'api','/v4/aliases/koinophobialabs.com?teamId=team_GrnNjNAupVBmY91WucyLJOoV','--method','GET'],{encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:30000}));
  if(result.deploymentId!==receipt.live_deployment)throw Error('Production moved after verification');
 }
 phase='database-credential-read';
 const connection=execFileSync(process.execPath,[join(homedir(),'.npm/_npx/74274893b9fe65d3/node_modules/neonctl/bin/cli.js'),'connection-string','br-still-lake-atr1qw2c','--project-id','crimson-frog-18448293','--role-name','neondb_owner','--database-name','neondb','--ssl','require'],{encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:30000}).trim();
 const parsed=new URL(connection);if(parsed.hostname.split('.')[0]!=='ep-billowing-haze-atbq2s9a'||parsed.pathname!=='/neondb')throw Error('Database identity');
 phase='database-connect';
 parsed.searchParams.set('sslmode','verify-full');
 db=new Pool({connectionString:parsed.href,max:2,application_name:'WO-0272-reviewed-refresh',connectionTimeoutMillis:10000,statement_timeout:30000});db.on('error',()=>{});
 const identity=(await db.query('select current_database() db,current_user role,pg_is_in_recovery() recovery')).rows[0];if(identity.db!=='neondb'||identity.role!=='neondb_owner'||identity.recovery)throw Error('Database identity');
 phase='cohort-read';
 const live=(await db.query('select id,partner_id,website,data from team_leads where partner_id=$1 order by id',[target])).rows;
 const newRows=live.filter(r=>!targetRows.some(t=>t.id===r.id));
 const summary={reviewed:prepared.length,current_target_leads:live.length,added_since_audit:newRows.length,mode:apply?'apply':'read-only'};
 if(!apply){console.log(JSON.stringify(summary));}
 else{
  // Concurrent new leads are outside this immutable reviewed snapshot; preserve them.
  const stamp=Date.now();const backup=join(dir,`${planFile.slice(0,-5)}-database-before-${stamp}.json`);
  if(existsSync(join(dir,receiptFile)))throw Error('Batch already applied');
  const counts={updated:0,confirmed:0,failed:0,replayed:0,transaction_current_total:0,untouched_added_since_audit:0};
  phase='transaction';
  await transaction(async q=>{
   const actor=(await q.query("select * from team_partners where active and role='owner' order by id limit 1")).rows[0] as Partner|undefined;
   if(!actor)throw Error('Owner context unavailable');
   const locked=(await q.query('select * from team_leads where partner_id=$1 order by id for update',[target])).rows;
   if(prepared.some(p=>locked.filter(r=>r.id===p.row.id&&r.partner_id===target&&r.website===p.row.website).length!==1))throw Error('Target changed');
   const untouched=locked.filter(r=>!prepared.some(p=>p.row.id===r.id));
   counts.transaction_current_total=locked.length;counts.untouched_added_since_audit=untouched.length;
   writeFileSync(backup,JSON.stringify(locked),{mode:0o600,flag:'wx'});
   for(const item of prepared){
    if(Date.now()>=deadline-120_000)throw Error('Insufficient transaction deadline reserve');
    const result=await importRecheck(q,actor,item.row.id,item.audit);counts.updated+=result.updated;counts.replayed+=Number(result.replayed);counts[result.confirmed?'confirmed':'failed']++;
    const before=locked.find(r=>r.id===item.row.id)!;
    const after=(await q.query('select * from team_leads where id=$1',[item.row.id])).rows[0];
    const unrelated=(v:Record<string,unknown>)=>Object.fromEntries(Object.entries(v).filter(([k])=>!['recheck','evidence','opener','leverage_score'].includes(k)));
    if(JSON.stringify({...before,data:unrelated(before.data)})!==JSON.stringify({...after,data:unrelated(after.data)}))throw Error('Unrelated lead fields changed');
   }
   if(untouched.length){const after=(await q.query('select * from team_leads where id=any($1) order by id',[untouched.map(r=>r.id)])).rows;if(JSON.stringify(after)!==JSON.stringify(untouched))throw Error('Unreviewed additions changed');}
   if(Date.now()>=deadline-60_000)throw Error('Insufficient commit and readback reserve');
  },db);
  phase='postcommit-readback';
  const readback=(await db.query("select data->'recheck'->>'status' status,count(*)::int count from team_leads where id=any($1) and data->'recheck'->>'work_order'='WO-0272' group by 1",[prepared.map(p=>p.row.id)])).rows;
  const currentTotal=(await db.query('select count(*)::int n from team_leads where partner_id=$1',[target])).rows[0].n;
  const receipt={at:new Date().toISOString(),...summary,plan_file:planFile,plan_sha256:planSha,cohort_sha256:plan.cohort_sha256,audited_snapshot:prepared.length,...counts,postcommit_total:currentTotal,postcommit_additions:currentTotal-prepared.length,readback};
  phase='receipt-write';
  writeFileSync(join(dir,receiptFile),JSON.stringify(receipt),{mode:0o600,flag:'wx'});
  writeFileSync(join(root,'evidence',countsFile),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(receipt));
 }
}catch(e){const error=e as {code?:unknown;name?:unknown;message?:unknown};const code=typeof error.code==='string'&&/^[A-Z0-9_]{1,50}$/.test(error.code)?error.code:null;const timedOut=typeof error.message==='string'&&/timeout|timed out/i.test(error.message);console.error(JSON.stringify({error:'WO-0272 data operation stopped',phase,code,timedOut,identityMismatch:error.message==='Database identity',details:'Private evidence retained; provider details withheld.'}));process.exitCode=1;}
finally{await db?.end().catch(()=>{});}

}
void main().catch(()=>{console.error('WO-0272 preparation failed; provider and private details withheld.');process.exitCode=1;});
