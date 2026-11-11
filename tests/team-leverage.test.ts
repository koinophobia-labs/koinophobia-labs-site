import test from 'node:test';
import assert from 'node:assert/strict';
import {confirm,type Audit,type Observation,type Check} from '@koinophobia/site-auditor/model';
import {confirmedEvidence} from './auditor-fixtures';
import {confirmedLeverage,strongestOpener} from '../lib/team/leverage';
import {importRecheck} from '../lib/team/recheck-import';
import {seed} from '../lib/team/seed';
import type {Queryable} from '../lib/payments';
const finding=(check:Check)=>{
 const source=confirmedEvidence();
 const now=Date.now();
 const a={...source.observations[0],check,run_id:'fictional-a',measured_at:new Date(now-601000).toISOString()} as Observation;
 const b={...source.observations[1],check,run_id:'fictional-b',measured_at:new Date(now-1000).toISOString()} as Observation;
 return {...confirm([b],[a])[0],measurement:`FICTIONAL ${check}`,impact:'Fictional observed effect.',verify_url:'https://fictional.example/'};
};
const audit=():Audit=>({version:'2.1.0',run_id:'fictional-recheck',url:'https://fictional.example/',final_url:'https://fictional.example/',measured_at:new Date().toISOString(),findings:[finding('Slow page'),finding('Unfinished content'),finding('Dead contact / booking / order link')],observations:[],notes:[],samples:[]});
test('strongest proof-backed finding wins regardless of insertion order; incomplete proof abstains',()=>{
 const a=audit();assert.equal(confirmedLeverage(a.findings)[0].check,'Dead contact / booking / order link');
 assert.match(strongestOpener(a.findings)!,/Dead contact/);
 assert.equal(confirmedLeverage([{...a.findings[0],observations:[]}]).length,0);
 assert.equal(strongestOpener([{confidence:'confirmed',measurement:'not enough'}]),undefined);
});
function fixture(prior:Record<string,unknown>={}){
 const calls:{sql:string;values?:unknown[]}[]=[];
 const lead={id:'fictional-lead',partner_id:'fictional-partner',website:'https://fictional.example/',data:{notes:'preserved',stage:'Interested',...prior}};
 const q={query:async(sql:string,values?:unknown[])=>{
  calls.push({sql,values});
  if(sql.startsWith('select id,'))return {rows:[lead]};
  if(sql.startsWith('update team_leads'))return {rows:[{recheck:JSON.parse(String(values?.[1])).recheck}]};
  if(sql.startsWith('insert into team_site_checks'))return {rows:[]};
  throw Error('unexpected SQL');
 }} as Queryable;
 return {q,calls,lead};
}
test('owner recheck uses a bounded additive patch, strongest opener, existing site-check storage',async()=>{
 const {q,calls}=fixture();const owner=seed(false).partners.find(p=>p.role==='owner')!;
 const result=await importRecheck(q,owner,'fictional-lead',audit());assert.equal(result.updated,1);
 const update=calls.find(c=>c.sql.startsWith('update'))!;
 assert.match(update.sql,/data=data \|\|/);
 const patch=JSON.parse(String(update.values?.[1]));
 assert.deepEqual(Object.keys(patch).sort(),['evidence','leverage_score','opener','recheck']);
 assert.match(patch.opener,/Dead contact/);assert.equal(patch.evidence.length,3);
 assert.ok(calls.some(c=>c.sql.startsWith('insert into team_site_checks')));
});
test('failed recheck retains original evidence and notes, sets count zero',async()=>{
 const {q,calls}=fixture({evidence:[finding('Slow page')]});const owner=seed(false).partners.find(p=>p.role==='owner')!;
 await importRecheck(q,owner,'fictional-lead',{...audit(),findings:[]});
 const patch=JSON.parse(String(calls.find(c=>c.sql.startsWith('update'))!.values?.[1]));
 assert.deepEqual(Object.keys(patch),['recheck']);assert.equal(patch.recheck.status,'re-check failed');assert.equal(patch.recheck.confirmed_count,0);
});
test('partner, stale input, website mismatch and a newer recheck all prevent writes',async()=>{
 const partners=seed(false).partners;const owner=partners.find(p=>p.role==='owner')!,partner=partners.find(p=>p.role==='partner')!;
 for(const [p,a,prior] of [[partner,audit(),{}],[owner,{...audit(),measured_at:'2020-01-01T00:00:00Z'},{}],[owner,{...audit(),url:'https://other.example/'},{}],[owner,audit(),{recheck:{checked_at:new Date(Date.now()+10000).toISOString()}}]] as const){
  const {q,calls}=fixture(prior);await assert.rejects(()=>importRecheck(q,p,'fictional-lead',a));assert.equal(calls.some(c=>/^(update|insert)/.test(c.sql)),false);
 }
});
test('replaying the same recheck is idempotent',async()=>{
 const a=audit(),{q,calls}=fixture({recheck:{run_id:a.run_id,status:'confirmed',checked_at:a.measured_at}});
 const result=await importRecheck(q,seed(false).partners.find(p=>p.role==='owner')!,'fictional-lead',a);
 assert.equal(result.updated,0);assert.equal(calls.some(c=>/^(update|insert)/.test(c.sql)),false);
});
