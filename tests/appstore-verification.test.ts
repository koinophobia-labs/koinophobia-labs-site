import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,readFileSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {sign,X509Certificate} from 'node:crypto';
import {Environment,SignedDataVerifier,type JWSTransactionDecodedPayload as Transaction} from '@apple/app-store-server-library';
import {verifyEvent,InvalidNotification,type AppleServices} from '../lib/appstore/apple';
import {eligibility,calculate,type NetProceeds} from '../lib/appstore/money';
import {transfersEnabled} from '../lib/appstore/service';
const app={key:'fixture',bundleId:'test.fixture',appAppleId:123,offerIdentifiers:['SAIIKHOTIC 10 percent first month']};
const date=Date.now();
const transaction:Transaction={bundleId:app.bundleId,environment:Environment.PRODUCTION,transactionId:'paid-first',originalTransactionId:'origin',productId:'monthly',purchaseDate:date,price:7290,currency:'USD',storefront:'USA',signedDate:date,inAppOwnershipType:'PURCHASED',type:'Auto-Renewable Subscription',offerType:3,offerIdentifier:app.offerIdentifiers[0],offerDiscountType:'PAY_AS_YOU_GO'};
function fixture(t=transaction, history:Transaction[]=[], environment=Environment.PRODUCTION, bad=false) {
 const n={notificationUUID:'fixture-uuid',notificationType:'SUBSCRIBED',data:{bundleId:app.bundleId,appAppleId:app.appAppleId,environment,signedTransactionInfo:'embedded'}};
 const counts={notification:0,lookup:0,history:0,transactions:0};
 const service={verifier:{verifyAndDecodeNotification:async()=>{counts.notification++;if(bad)throw Error('bad signature');return n;},verifyAndDecodeTransaction:async(jws:string)=>{counts.transactions++;return jws==='embedded'||jws==='lookup'?t:history[Number(jws)];}},client:{getTransactionInfo:async(id:string)=>{counts.lookup++;assert.equal(id,t.transactionId);return{signedTransactionInfo:'lookup'};},getTransactionHistory:async()=>{counts.history++;return{signedTransactions:history.map((_,i)=>String(i)),hasMore:false};}}};
 return{signed:'header.'+Buffer.from(JSON.stringify(n)).toString('base64url')+'.signature',service,counts};
}
test('discounted paid first month requires notification verification and separate signed API lookup',async()=>{
 const f=fixture();const e=await verifyEvent(f.signed,[app],()=>f.service as AppleServices);assert.equal(eligibility(e),null);assert.equal(e.attribution?.offer,app.offerIdentifiers[0]);assert.deepEqual(f.counts,{notification:1,lookup:1,history:0,transactions:2});
});
test('full-price renewal recovers only its verified original subscription attribution',async()=>{
 const renewal={...transaction,transactionId:'renewal',purchaseDate:date+2678400000,price:7990,offerType:undefined,offerIdentifier:undefined,offerDiscountType:undefined};
 const f=fixture(renewal,[transaction]);assert.equal((await verifyEvent(f.signed,[app],()=>f.service as AppleServices)).attribution?.transactionId,'paid-first');
 const other=fixture(renewal,[{...transaction,originalTransactionId:'other'}]);assert.equal(eligibility(await verifyEvent(other.signed,[app],()=>other.service as AppleServices)),'not_attributed');
});
test('invalid signature prevents lookup; mismatched API receipt is rejected',async()=>{
 const f=fixture(transaction,[],Environment.PRODUCTION,true);await assert.rejects(verifyEvent(f.signed,[app],()=>f.service as AppleServices),InvalidNotification);assert.equal(f.counts.lookup,0);
 const g=fixture();g.service.verifier.verifyAndDecodeTransaction=async(s:string)=>({...transaction,transactionId:s==='lookup'?'different':'paid-first'});await assert.rejects(verifyEvent(g.signed,[app],()=>g.service as AppleServices),InvalidNotification);
});
for(const [name,extra,reason] of [
 ['zero charge',{price:0},'free_or_missing_price'],['missing price',{price:undefined},'free_or_missing_price'],['free trial',{offerDiscountType:'FREE_TRIAL'},'free_or_missing_price'],['revocation',{revocationDate:date+1},'revoked'],['family shared',{inAppOwnershipType:'FAMILY_SHARED'},'not_purchased'],['different offer',{offerIdentifier:'OTHER'},'not_attributed'],
] as const) test(name+' earns no commission',async()=>{const f=fixture({...transaction,...extra});assert.equal(eligibility(await verifyEvent(f.signed,[app],()=>f.service as AppleServices)),reason);});
test('verified sandbox charge never earns commission',async()=>{const f=fixture({...transaction,environment:Environment.SANDBOX},[],Environment.SANDBOX);assert.equal(eligibility(await verifyEvent(f.signed,[app],()=>f.service as AppleServices)),'sandbox');});
test('25% uses reported net proceeds after taxes and commission, for both 15% and 30%',()=>{
 const base:NetProceeds={transactionId:'paid-first',app:app.key,productId:'monthly',storefront:'USA',currency:'USD',priceMilliunits:7290,purchaseDate:date,amount:'6.20',appleBasisPoints:1500,source:'synthetic Apple report',verifiedAt:new Date().toISOString()};
 const fx={currency:'USD',usdPerUnit:'1',date:'2026-11-12',source:'USD identity'};
 assert.equal(calculate(base,fx).cents,155);
 assert.equal(calculate({...base,appleBasisPoints:3000,amount:'5.10'},fx).cents,128);
 assert.equal(calculate({...base,currency:'EUR',amount:'5.42'},{...fx,currency:'EUR',usdPerUnit:'1.1'}).cents,149);
 assert.throws(()=>calculate({...base,source:''},fx));
});
test('transfers require all production/live gates',()=>{
 const saved={...process.env};try{for(const env of ['preview','development','production'])for(const mode of ['test','live'])for(const enabled of ['false','true']){process.env.VERCEL_ENV=env;process.env.STRIPE_CONNECT_MODE=mode;process.env.APPSTORE_TRANSFERS_ENABLED=enabled;assert.equal(transfersEnabled(),env==='production'&&mode==='live'&&enabled==='true');}}finally{for(const k of ['VERCEL_ENV','STRIPE_CONNECT_MODE','APPSTORE_TRANSFERS_ENABLED']){if(saved[k]===undefined)delete process.env[k];else process.env[k]=saved[k];}}
});
test('real certificate-chain and ES256 verification rejects tampering, wrong root/app/environment and expiration',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'appstore-crypto-'));
 const openssl=(...args:string[])=>execFileSync('openssl',args,{cwd:dir,stdio:'ignore'});
 for(const name of ['root','intermediate','leaf'])openssl('ecparam','-name','prime256v1','-genkey','-noout','-out',name+'.key');
 writeFileSync(join(dir,'root.cnf'),'[req]\ndistinguished_name=dn\nx509_extensions=ca\nprompt=no\n[dn]\nCN=WO-0292 Test Root\n[ca]\nbasicConstraints=critical,CA:true\nkeyUsage=critical,keyCertSign,cRLSign\n');
 openssl('req','-new','-x509','-key','root.key','-days','2','-out','root.pem','-config','root.cnf');
 writeFileSync(join(dir,'intermediate.ext'),'basicConstraints=critical,CA:true\nkeyUsage=critical,keyCertSign,cRLSign\n1.2.840.113635.100.6.2.1=DER:05:00\n');
 writeFileSync(join(dir,'leaf.ext'),'basicConstraints=critical,CA:false\nkeyUsage=critical,digitalSignature\n1.2.840.113635.100.6.11.1=DER:05:00\n');
 for(const [name,parent] of [['intermediate','root'],['leaf','intermediate']]){openssl('req','-new','-key',name+'.key','-subj','/CN=WO-0292 Test '+name,'-out',name+'.csr');openssl('x509','-req','-in',name+'.csr','-CA',parent+'.pem','-CAkey',parent+'.key','-CAcreateserial','-days','2','-extfile',name+'.ext','-out',name+'.pem');}
 const cert=(name:string)=>new X509Certificate(readFileSync(join(dir,name+'.pem'))).raw;
 const header=Buffer.from(JSON.stringify({alg:'ES256',x5c:['leaf','intermediate','root'].map(n=>cert(n).toString('base64'))})).toString('base64url');
 const jwt=(payload:object)=>{const message=header+'.'+Buffer.from(JSON.stringify(payload)).toString('base64url');return message+'.'+sign('sha256',Buffer.from(message),{key:readFileSync(join(dir,'leaf.key')),dsaEncoding:'ieee-p1363'}).toString('base64url');};
 const verifier=new SignedDataVerifier([cert('root')],false,Environment.PRODUCTION,app.bundleId,app.appAppleId);
 const n={notificationUUID:'crypto-fixture',notificationType:'TEST',version:'2.0',signedDate:Date.now(),data:{bundleId:app.bundleId,appAppleId:app.appAppleId,environment:'Production'}};
 const valid=jwt(n);assert.equal((await verifier.verifyAndDecodeNotification(valid)).notificationUUID,n.notificationUUID);
 assert.equal((await verifier.verifyAndDecodeTransaction(jwt(transaction))).transactionId,transaction.transactionId);
 const signature=Buffer.from(valid.split('.')[2],'base64url');signature[0]^=1;await assert.rejects(verifier.verifyAndDecodeNotification(valid.split('.').slice(0,2).join('.')+'.'+signature.toString('base64url')));
 await assert.rejects(verifier.verifyAndDecodeNotification(jwt({...n,data:{...n.data,bundleId:'wrong'}})));
 await assert.rejects(verifier.verifyAndDecodeNotification(jwt({...n,data:{...n.data,environment:'Sandbox'}})));
 await assert.rejects(verifier.verifyAndDecodeNotification(jwt({...n,signedDate:Date.now()+10*86400000})));
 const production=new SignedDataVerifier([readFileSync('lib/appstore/certs/AppleRootCA-G3.cer')],true,Environment.PRODUCTION,app.bundleId,app.appAppleId);
 await assert.rejects(production.verifyAndDecodeNotification(valid));
});
