import test from 'node:test';
import assert from 'node:assert/strict';
import {POST} from '../app/api/appstore/notifications/route';
import {GET} from '../app/api/appstore/reconcile/route';
import configuredApps from '../lib/appstore/apps.json';
test('notification ingress rejects unsigned, malformed, oversized and invalid signed payloads without any database connection',async()=>{
 const saved={...process.env};
 try {
  process.env.VERCEL_ENV='production';process.env.APPSTORE_NOTIFICATIONS_ENABLED='true';process.env.DATABASE_URL='postgres://127.0.0.1:1/unreachable';
  process.env.APPSTORE_PRIVATE_KEY='synthetic-not-a-key';process.env.APPSTORE_KEY_ID='fixture';process.env.APPSTORE_ISSUER_ID='fixture';
  const send=(body:string)=>POST(new Request('https://example.test/api/appstore/notifications',{method:'POST',body}));
  assert.equal((await send('{}')).status,400);assert.equal((await send('not JSON')).status,400);assert.equal((await send('x'.repeat(256*1024+1))).status,413);
  assert.equal((await send(JSON.stringify({signedPayload:'bad'}))).status,400);
  const a=configuredApps[0],hint={data:{bundleId:a.bundleId,appAppleId:a.appAppleId,environment:'Production'}};
  const invalid=Buffer.from(JSON.stringify({alg:'none'})).toString('base64url')+'.'+Buffer.from(JSON.stringify(hint)).toString('base64url')+'.';
  const response=await send(JSON.stringify({signedPayload:invalid}));assert.equal(response.status,400);assert.deepEqual(await response.json(),{error:'Invalid notification'});
  process.env.VERCEL_ENV='preview';assert.equal((await send('{}')).status,503);
  delete process.env.CRON_SECRET;assert.equal((await GET(new Request('https://example.test/api/appstore/reconcile'))).status,401);
 }finally{for(const k of ['VERCEL_ENV','APPSTORE_NOTIFICATIONS_ENABLED','DATABASE_URL','APPSTORE_PRIVATE_KEY','APPSTORE_KEY_ID','APPSTORE_ISSUER_ID','CRON_SECRET']){if(saved[k]===undefined)delete process.env[k];else process.env[k]=saved[k];}}
});
