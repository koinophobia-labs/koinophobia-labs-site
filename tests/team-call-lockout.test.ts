import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {CallPreparation, preparationReason, retrySeconds} from '../lib/team/call-preparation';
import {actionBucket, actionRateLimit} from '../lib/team/action-limits';
import {digest,rateLimit,RateLimitFault} from '../lib/team/auth';
import type {Queryable} from '../lib/payments';

test('failed preparation is attempted once, retries after 60 seconds, then stops across polls and lead changes',async()=>{
 const attempts=new CallPreparation();let now=0,count=0;
 const fail=async()=>{count++;throw Error('fixture failure')};
 for(now=0;now<=360_000;now+=1500) await attempts.run('fixture',fail,()=>now).catch(()=>{});
 assert.equal(count,2);
 await attempts.run('other',async()=>{},()=>now);
 await attempts.run('fixture',fail,()=>now).catch(()=>{});assert.equal(count,2);
 const success=new CallPreparation();let successes=0;
 for(let i=0;i<100;i++)await success.run('fixture',async()=>{successes++},()=>now);
 assert.equal(successes,1);
});
test('in-flight preparation is claimed before awaiting; backoff starts at failure',async()=>{
 const prep=new CallPreparation();let now=0,resolve!:()=>void,count=0;
 const first=prep.run('fixture',async()=>{count++;await new Promise<void>(r=>resolve=r);throw Error('fail')},()=>now).catch(()=>{});
 now=120_000;await prep.run('fixture',async()=>{count++},()=>now);assert.equal(count,1);
 resolve();await first;now=179_999;await prep.run('fixture',async()=>{count++},()=>now);assert.equal(count,1);
 now=180_000;await prep.run('fixture',async()=>{count++},()=>now);assert.equal(count,2);
});
test('preparation messages allow only reviewed fixed reasons and retry seconds are bounded to positive seconds',()=>{
 assert.equal(preparationReason('secret customer payload'),'');
 assert.equal(preparationReason('This contact has opted out.'),'This contact has opted out.');
 assert.equal(retrySeconds(new Response('',{headers:{'Retry-After':'23'}}),{}),23);
 assert.equal(retrySeconds(new Response(''),{retryAfter:18}),18);
 assert.equal(retrySeconds(new Response(''),{}),60);
});
test('actual rate limiter separates preparation, navigation and outcomes from the 600-action bucket',async()=>{
 const counts=new Map<string,number>();
 const q={query:async(_sql:string,values:unknown[])=>{const key=String(values[0]),n=(counts.get(key)??0)+1;counts.set(key,n);return {rows:[{attempts:n,retry_after:37}]}}} as unknown as Queryable;
 for(let i=0;i<120;i++)await assert.rejects(actionRateLimit(q,'fixture-partner','removed-action'),e=>(e as {status:number}).status===404);
 assert.equal(counts.size,0);
 for(let i=0;i<600;i++)await actionRateLimit(q,'fixture-partner','call-cell');
 await assert.rejects(actionRateLimit(q,'fixture-partner','call-cell'),e=>e instanceof RateLimitFault&&e.retryAfter===37);
 for(const action of ['active-lead','call-outcome']){for(let i=0;i<600;i++)await actionRateLimit(q,'fixture-partner',action);await assert.rejects(actionRateLimit(q,'fixture-partner',action),RateLimitFault);}
 for(let i=0;i<300;i++)await actionRateLimit(q,'fixture-partner','prepare-call');
 await assert.rejects(actionRateLimit(q,'fixture-partner','prepare-call'),RateLimitFault);
 assert.equal(counts.get(digest('action:fixture-partner')),601);
 assert.deepEqual(actionBucket('prepare-call'),{prefix:'prepare-call:',limit:300});
 for(let i=0;i<8;i++)await rateLimit(q,'login:fixture');
 await assert.rejects(rateLimit(q,'login:fixture'),RateLimitFault);
});
test('login, password, token and site-check limits retain production values and call sites',()=>{
 for(const file of ['lib/team/auth.ts','app/team/api/[action]/route.ts']){
  const before=execFileSync('git',['show',`32b5038:${file}`],{encoding:'utf8'}),after=readFileSync(file,'utf8');
  const calls=(s:string)=>s.match(/await rateLimit\([^;]+;/g)?.filter(s=>!s.includes('"action:"'));
  assert.deepEqual(calls(after),calls(before));
 }
});
