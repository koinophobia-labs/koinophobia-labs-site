import test from 'node:test';
import assert from 'node:assert/strict';
import {hookTier,findingTier,FRESH_MS} from '../lib/team/hook-tier';
import {callQueue} from '../lib/team/call-schedule';
import {callNow,CALL_OUTCOMES,dealText,smsLink} from '../lib/team/call-domain';
import {OPENER,findingHook,breakFirstScript,CLOSE,REFUND,TEXT_ASK,voicemail} from '../lib/team/scripts';
import {slowSeconds,whatFixedMeans,checkItYourself} from '../lib/team/plain-findings';
import {previewLeads,previewCallState} from '../lib/team/break-first-preview';
const now=new Date('2026-11-17T16:00:00Z');
const finding=(check:string,key='fixture')=>({check,key,measurement:'Fictional visible break',confidence:'confirmed',measured_at:now.toISOString()});
for(const check of ['Dead contact / booking / order link','Closed Google Form','Booking widget failure','HTTPS failure','Wrong key link','Unfinished content','Insecure form'])test(`Tier A: ${check}`,()=>assert.equal(hookTier([finding(check)],now),'A'));
for(const key of ['horizontal-overflow','zoomed-out','overlapping-targets','small-crowded-primary','tiny-primary-text'])test(`Tier B layout: ${key}`,()=>assert.equal(hookTier([finding('Mobile layout',key)],now),'B'));
for(const check of ['Broken image','Mobile contact route'])test(`Tier B: ${check}`,()=>assert.equal(hookTier([finding(check)],now),'B'));
test('certificate threshold requires an actual date within 30 days',()=>{
 for(const [date,tier] of [['2026-12-17T16:00:00Z','B'],['2026-12-17T16:00:01Z','hold'],['2026-11-16','hold'],['unknown','hold']])assert.equal(hookTier([{...finding('Expiring certificate'),measurement:date}],now),tier);
});
test('hold, unknown, failed and freshness boundaries fail closed',()=>{
 for(const check of ['Slow page','Lighthouse mobile performance','Legacy','Mobile layout'])assert.equal(hookTier([finding(check)],now),'hold');
 assert.equal(hookTier([],now),'hold');assert.equal(hookTier([{...finding('HTTPS failure'),confidence:'unknown'}],now),'hold');
 const f=finding('HTTPS failure');
 assert.equal(hookTier([f],now,{status:'re-check failed'}),'hold');
 for(const stamp of ['',new Date(+now-FRESH_MS-1).toISOString(),new Date(+now+1).toISOString()])assert.equal(hookTier([{...f,measured_at:stamp}],now),'recheck');
 assert.equal(hookTier([{...f,measured_at:new Date(+now-FRESH_MS).toISOString()}],now),'A');
 assert.equal(hookTier([{...f,measured_at:undefined}],now,{status:'confirmed',checked_at:now.toISOString()}),'A');
 assert.equal(hookTier([finding('Slow page'),f],now),'A');
});
test('Tier A open beats Tier B best; holds and stale never enter Call now',()=>{
 const base=previewLeads(now)[0];
 const a={...base,id:'a',time_zone:'America/Denver',evidence:[finding('HTTPS failure')]}; // 9AM open
 const b={...base,id:'b',time_zone:'America/Chicago',evidence:[finding('Mobile layout','horizontal-overflow')]}; // 10AM best
 const hold={...base,id:'hold',evidence:[finding('Slow page')]};
 const stale={...base,id:'stale',evidence:[{...finding('HTTPS failure'),measured_at:'2020-01-01'}]};
 const rows=callQueue([b,hold,stale,a],[],now,'America/Chicago');
 assert.deepEqual(rows.slice(0,2).map(x=>[x.lead.id,x.group]),[['a','open'],['b','best']]);
 assert.deepEqual(callNow([b,hold,stale,a],[],now).map(x=>x.id),['a','b']);
 assert.deepEqual(rows.slice(2).map(x=>x.group),['recheck','hold']);
 assert.equal(callNow([{...a,call_outcome:'Fixed on recheck'}],[],now).length,0);
});
test('load key does not quote LCP; sub-four-second LCP is not slow',()=>{
 const f={check:'Slow page',measurement:'Three fresh Chromium loads: median LCP 1200 ms; median load 9876 ms.'};
 assert.equal(slowSeconds({...f,key:'load'}),10);assert.equal(slowSeconds({...f,key:'lcp'}),null);
 assert.equal(slowSeconds({...f,key:'lcp',measurement:'median LCP 4300 ms; median load 19000 ms'}),4);
});
test('script lint: opening and first hook sentence contain no banned terms or unsupported claims',()=>{
 const banned=/\b(speed|slow|SEO|Google|ranking|audit|report)\b/i;
 assert.doesNotMatch(OPENER,banned);
 for(const f of [finding('Dead contact / booking / order link','http-404'),finding('Closed Google Form'),finding('Booking widget failure'),finding('HTTPS failure','https-refused'),finding('Mobile layout','horizontal-overflow'),finding('Mobile layout','small-crowded-primary'),finding('Insecure form')]){
  const hook=findingHook(f);assert.doesNotMatch(hook.split('.')[0],banned);
  assert.doesNotMatch(hook,/losing customers|lost (?:revenue|sales)|competitor|go back and try|may leave/i);
  // Claim numbers are dates from the finding; approved commercial copy is tested separately.
  const numbers=hook.match(/\d+(?:\.\d+)?/g)??[];
  for(const n of numbers)assert.ok(f.measured_at?.includes(n),`unbound spoken number ${n}`);
  assert.ok(whatFixedMeans(f));assert.ok(checkItYourself(f));
 }
 assert.match(CLOSE,/flat \$299.*48 to 72 hours/);assert.match(REFUND,/refunds you/);assert.match(TEXT_ASK,/next ten seconds/);
 assert.doesNotMatch(findingHook(finding('Insecure form')),/Not secure|security warning/i);
 assert.doesNotMatch(voicemail(finding('Mobile layout','horizontal-overflow')),/I'll text|video/i);
 assert.doesNotMatch(breakFirstScript(),/\$299/);
});
test('outcomes and consent-confirming text preserve STOP and device delimiters',()=>{
 for(const outcome of ['Saw it','Text OK','Fixed on recheck','Referred to current dev'])assert.ok(CALL_OUTCOMES.includes(outcome as typeof CALL_OUTCOMES[number]));
 const s=previewCallState();const body=dealText(s.lead!,'Book Now',s.deal!,'https://example.test/go/demo');
 assert.match(body,/as we just talked about/);assert.match(body,/Reply STOP and we won't text again\.$/);
 for(const ios of [true,false])assert.equal(decodeURIComponent(smsLink('2025550100',body,ios)!.split('body=')[1]),body);
 assert.equal(dealText(s.lead!,"Book Now",{...s.deal!,services:["care"],price:9900,monthly:9900},"https://example.test"),"");
 assert.equal(findingTier(finding('Slow page')),'hold');
});
