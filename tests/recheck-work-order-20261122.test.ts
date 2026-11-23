import test from 'node:test';
import assert from 'node:assert/strict';
import {importRecheck} from '../lib/team/recheck-import';
import {seed} from '../lib/team/seed';
import type {Queryable} from '../lib/payments';
import type {Audit} from '@koinophobia/site-auditor/model';
test('dated recheck stamps both storage records while preserving legacy default',async()=>{
  const actor=seed(false).partners.find(p=>p.role==='owner')!;
  for(const workOrder of [undefined,'WO-0285-recheck-20261122'] as const){
    const audit={version:'2.1.4',run_id:'fictional-dated-recheck',url:'https://fictional.example/',final_url:'https://fictional.example/',measured_at:new Date().toISOString(),findings:[],observations:[],notes:[],samples:[]} as Audit;
    const markers:string[]=[];
    const q={query:async(sql:string,values?:unknown[])=>{
      if(sql.startsWith('select id,'))return {rows:[{id:'fictional-lead',partner_id:'fictional-partner',website:audit.url,data:{}}]};
      if(sql.startsWith("select data->>'measured_at'"))return {rows:[]};
      if(sql.startsWith('update team_leads')){const recheck=JSON.parse(String(values?.[1])).recheck;markers.push(recheck.work_order);return {rows:[{recheck}]};}
      if(sql.startsWith('insert into team_site_checks')){markers.push((values?.[2] as {work_order:string}).work_order);return {rows:[]};}
      throw Error('Unexpected fixture SQL');
    }} as Queryable;
    await importRecheck(q,actor,'fictional-lead',audit,workOrder);
    assert.deepEqual(markers,[workOrder??'WO-0272',workOrder??'WO-0272']);
  }
});
