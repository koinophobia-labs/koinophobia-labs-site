import {randomUUID} from 'node:crypto';
import {isConfirmed,rankFindings,leverageScore,impactLine,verifyLink,type Audit,type Finding as AuditFinding} from '@koinophobia/site-auditor/model';
import type {Queryable} from '../payments';
import type {Partner} from './types';
import {owner,Fault} from './domain';

/** Existing recheck JSON update + existing Site Check storage, in one team-write transaction. */
export async function importRecheck(q:Queryable,p:Partner,id:string,audit:Audit,workOrder:'WO-0272'|'WO-0285-recheck-20261122'='WO-0272'){
  owner(p);
  if(!audit||!Array.isArray(audit.findings)||audit.findings.length>30||!Number.isFinite(Date.parse(audit.measured_at)))throw new Fault('Invalid recheck.');
  const age=Date.now()-Date.parse(audit.measured_at);
  if(age< -60_000||age>24*60*60*1000)throw new Fault('A recheck must be current.');
  const rows=await q.query('select id,partner_id,website,data from team_leads where id=$1 for update',[id]);
  const lead=rows.rows[0];if(!lead)throw new Fault('Lead not found.',404);
  const canonical=(u:string)=>{const x=new URL(u);x.hash='';return x.href;};
  if(canonical(lead.website)!==canonical(audit.url))throw new Fault('Recheck website does not match this lead.');
  const newer=await q.query("select data->>'measured_at' measured_at from team_site_checks where partner_id=$1 and (data->>'url'=any($2::text[]) or data->>'final_url'=any($2::text[])) order by created_at desc limit 20",[lead.partner_id,[lead.website,canonical(lead.website)]]);
  if(newer.rows.some(r=>Date.parse(r.measured_at)>Date.parse(audit.measured_at)))throw new Fault('A newer Site Check is already stored.',409);
  const previous=lead.data.recheck;
  if(previous?.checked_at&&Date.parse(previous.checked_at)>Date.parse(audit.measured_at))throw new Fault('A newer recheck is already stored.',409);
  if(previous?.run_id===audit.run_id)return {updated:0,confirmed:previous.status==='confirmed',replayed:true};
  const findings=rankFindings(audit.findings.filter(isConfirmed)).map(f=>({...f,impact:impactLine(f),verify_url:verifyLink(f),leverage:leverageScore(f)}));
  for(const f of findings){
    if(Date.parse(f.measured_at)<Date.now()-24*60*60*1000||Date.parse(f.measured_at)>Date.now()+60_000)throw new Fault('Finding timestamps must be current.');
  }
  const evidence=findings.map(f=>({...f,severity:Math.min(40,Math.round(leverageScore(f)*0.4))}));
  const primary=findings[0];
  const opener=primary?`${primary.measurement} ${impactLine(primary)} Check it yourself: ${verifyLink(primary)}`:'';
  const recheck={status:findings.length?'confirmed':'re-check failed',checked_at:audit.measured_at,confirmed_count:findings.length,findings:findings.map(f=>({key:f.key,measured_at:f.measured_at,label:f.label,page_name:f.page_name,url:f.url,check:f.check,measurement:f.measurement,impact:f.impact,verify_url:f.verify_url,leverage:f.leverage,confidence:f.confidence,proof_sha256:f.proof?.sha256})),work_order:workOrder,run_id:audit.run_id};
  // jsonb concatenation preserves contact, notes, stage, attribution and all other
  // current fields. The caller holds team-write, and the row is locked above.
  const patch={recheck,...(findings.length?{evidence,opener,leverage_score:leverageScore(primary)}:{})};
  const result=await q.query("update team_leads set data=data || $2::jsonb where id=$1 and website=$3 returning data->'recheck' recheck",[id,JSON.stringify(patch),lead.website]);
  if(result.rows[0]?.recheck?.run_id!==audit.run_id)throw new Fault('Recheck update verification failed.',409);
  const shape=(f:AuditFinding)=>({...f,name:f.check,status:f.confidence==='confirmed'?'review':'unknown',detail:f.measurement});
  await q.query('insert into team_site_checks(id,partner_id,data) values($1,$2,$3)',[randomUUID(),lead.partner_id,{version:audit.version,run_id:audit.run_id,url:audit.url,final_url:audit.final_url,measured_at:audit.measured_at,duration_ms:audit.samples[0]?.load??0,observations:audit.observations,findings:findings.map(shape),notes:audit.notes,retry_after:audit.retry_after,work_order:workOrder}]);
  return {updated:1,confirmed:!!findings.length,replayed:false};
}
