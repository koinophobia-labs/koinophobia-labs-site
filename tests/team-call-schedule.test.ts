import test from 'node:test';
import assert from 'node:assert/strict';
import {seed} from '../lib/team/seed';
import type {TeamLead} from '../lib/team/store';
import {callQueue,callHeader,scheduleLead,partnerTimeZone,localInstant,visibleCallLead,displayCallQueue} from '../lib/team/call-schedule';
import {savePartnerTimeZone} from '../lib/team/time-zone-store';
const lead=(id:string,zone='America/New_York',extra:Partial<TeamLead>={}):TeamLead=>({...seed(true).leads[0],id,business:'Fictional '+id,phone:'2025550101',time_zone:zone,...extra});
const zones=['America/New_York','America/Chicago','America/Denver','America/Los_Angeles'];
const rows=zones.map((z,i)=>lead(String(i),z));
const at=(hour:number)=>new Date(`2026-11-${hour>=24?'12':'11'}T${String(hour%24).padStart(2,'0')}:00:00Z`);
for(const [hour,expected] of [[13,['soon','soon','closed','closed']],[17,['open','best','best','open']],[20,['open','best','open','open']],[25,['closed','closed','closed','closed']]] as const){
 test(`grouping at ${hour-5} ET`,()=>{assert.deepEqual(rows.map(l=>scheduleLead(l,at(hour),'America/New_York').group),expected);});
}
test('best group precedes ordinary open; digital contacts are separate and hidden leads never leak',()=>{
 const hidden=[lead('opt',undefined,{opted_out:true}),lead('failed',undefined,{recheck:{status:'re-check failed',checked_at:'',confirmed_count:0}}),lead('declined',undefined,{call_outcome:'Not interested'}),lead('dont',undefined,{call_outcome:"Don't call"}),lead('lost')];
 const deals=[{...seed(true).deals[0],lead_id:'lost',stage:'Lost' as const}];
 const q=callQueue([...rows,...hidden,lead('email',undefined,{phone:''}),lead('unknown','invalid')],deals,at(17),'America/New_York');
 assert.deepEqual(q.map(r=>r.lead.id),['1','2','0','3','unknown','email']);
 assert.ok(hidden.every(l=>!visibleCallLead(l,deals)));
 assert.equal(q.at(-1)?.group,'digital');assert.match(callHeader(q,at(17),'America/New_York'),/4.*open now/);
});
test('8 AM header, opens soon minutes, weekend and next opening conversion',()=>{
 assert.match(callHeader(callQueue(rows,[],at(13),'America/New_York'),at(13),'America/New_York'),/First calls Wed at 9:00 AM \(ET businesses\)/);
 const r=scheduleLead(rows[0],new Date('2026-11-11T13:15:00Z'),'America/Chicago');assert.match(r.status,/45 min \(8:00 AM your time\)/);
 for(const z of zones){const r=scheduleLead(lead('weekend',z),new Date('2026-11-14T17:00:00Z'),'America/New_York');assert.equal(r.group,'closed');assert.match(r.status,/Monday/);}
 const r2=scheduleLead(rows[3],at(25),'America/New_York');assert.match(r2.status,/tomorrow after 9:00 AM their time = 12:00 PM tomorrow your time/);
});
test('restaurant lunch is avoided at both boundaries and resumes at 1:30',()=>{
 const r=lead('lunch','America/New_York',{vertical:'restaurant'});
 for(const [stamp,group] of [['2026-11-11T16:29:00Z','best'],['2026-11-11T16:30:00Z','soon'],['2026-11-11T18:29:00Z','soon'],['2026-11-11T18:30:00Z','best']])assert.equal(scheduleLead(r,new Date(stamp),'America/New_York').group,group);
});
test('DST spring/fall next weekday opens at 9 local and Arizona never changes offset',()=>{
 for(const [now,expected]of [['2026-03-06T23:00:00Z','2026-03-09T13:00:00.000Z'],['2026-10-30T23:00:00Z','2026-11-02T14:00:00.000Z']])assert.equal(scheduleLead(rows[0],new Date(now),'America/New_York').next?.toISOString(),expected);
 for(const date of [Date.UTC(2026,2,9),Date.UTC(2026,10,2)])assert.equal(localInstant(date,540,'America/Phoenix')?.getUTCHours(),16);
 assert.match(scheduleLead(lead('az','America/Phoenix'),new Date('2026-07-01T16:00:00Z'),'America/New_York').bestWindow,/1:00 PM–2:30 PM/);
 assert.match(scheduleLead(lead('az','America/Phoenix'),at(16),'America/New_York').bestWindow,/12:00 PM–1:30 PM/);
});
test('recorded hours support evening/weekend calls; absent or malformed hours use weekday defaults',()=>{
 const hours={source_url:'https://example.test/hours',checked_at:'2026-11-01T00:00:00Z',weekly:[{day:3,open:540,close:1140},{day:6,open:600,close:1020}]};
 const r=lead('late','America/Los_Angeles',{business_hours:hours});assert.equal(scheduleLead(r,at(25),'America/New_York').group,'open');
 assert.equal(scheduleLead(r,new Date('2026-11-14T19:00:00Z'),'America/New_York').group,'best');
 assert.equal(scheduleLead({...r,business_hours:{...hours,source_url:''}},at(25),'America/New_York').group,'closed');
 assert.equal(scheduleLead(rows[3],at(25),'America/New_York').group,'closed');
});
test('partner override is validated and converted; saving is scoped by authenticated actor',async()=>{
 assert.equal(partnerTimeZone('America/Los_Angeles','America/New_York'),'America/Los_Angeles');assert.equal(partnerTimeZone('bad','America/Phoenix'),'America/Phoenix');
 assert.match(scheduleLead(rows[0],at(13),'America/Los_Angeles').bestWindow,/7:00 AM–8:30 AM/);
 const values:unknown[][]=[];const q={query:async(_s:string,v?:unknown[])=>{values.push(v??[]);return{rows:[]};}};
 await savePartnerTimeZone(q,seed(true).partners[1],'America/Phoenix');assert.deepEqual(values[0],['partner-time-zone:demo-a','America/Phoenix']);
 await assert.rejects(savePartnerTimeZone(q,seed(true).partners[1],'bad'));assert.equal(values.length,1);
});

test('display retains authorized in-flight and paid-history rows without marking them callable',()=>{
 const kept=lead('retained','America/Chicago',{phone:'',recheck:{status:'re-check failed',checked_at:'',confirmed_count:0}});
 const paid=lead('paid');
 const deals=[{...seed(true).deals[0],lead_id:kept.id,stage:'Quote sent' as const},{...seed(true).deals[0],id:'paid-deal',lead_id:paid.id,stage:'Client paid' as const}];
 const q=displayCallQueue([rows[0],kept,paid],deals,at(17),'America/New_York');
 assert.equal(q.length,3);assert.deepEqual(q.filter(r=>r.group==='retained').map(r=>r.lead.id),['retained','paid']);
 assert.match(q[1].status,/Retained/);
 assert.match(callHeader(q.filter(r=>r.group==='retained'),at(17),'America/New_York'),/No callable leads/);
});
