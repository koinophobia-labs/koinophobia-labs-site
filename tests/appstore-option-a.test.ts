import test from 'node:test';
import assert from 'node:assert/strict';
import {Environment} from '@apple/app-store-server-library';
import {matchPublished,publishedProceeds,type PublishedQuote} from '../lib/appstore/published-proceeds';
import {matchFinancial,parseFinancialReport,type FinancialTransaction,type FinanceRow} from '../lib/appstore/financial-reports';
import {calculate,eligibility} from '../lib/appstore/money';
import {verifyEvent,type VerifiedEvent,type AppleServices} from '../lib/appstore/apple';
const purchase=Date.parse('2026-11-12T12:00:00Z');
const app={key:'test',bundleId:'test.app',appAppleId:123,offerIdentifiers:['SAIIKHOTIC'],products:[{id:'unlock',resourceId:'456',kind:'one_time' as const,offerId:'offer'}]};
const tx={bundleId:app.bundleId,environment:Environment.PRODUCTION,transactionId:'one',originalTransactionId:'one',productId:'unlock',storefront:'USA',price:8990,currency:'USD',purchaseDate:purchase,inAppOwnershipType:'PURCHASED',type:'Non-Consumable',offerType:3,offerIdentifier:'SAIIKHOTIC'};
const event:VerifiedEvent={uuid:'one',type:'ONE_TIME_CHARGE',environment:Environment.PRODUCTION,app,transaction:tx,attribution:{offer:'SAIIKHOTIC',transactionId:'one'},hash:'synthetic'};
const quote:PublishedQuote={productId:'unlock',territory:'USA',currency:'USD',price:'8.99',proceeds:'7.64',pricePointId:'price',scheduleId:'schedule',source:'https://api.appstoreconnect.apple.com/synthetic',fetchedAt:'2026-11-12T12:01:00Z'};
test('account-published Small Business and standard proceeds are used without another fee deduction',()=>{
  const small=matchPublished(event,[quote])!;assert.equal(calculate(small,{currency:'USD',usdPerUnit:'1',source:'identity',date:'2026-11-12'}).cents,191);
  const standard=matchPublished(event,[{...quote,proceeds:'6.29'}])!;assert.equal(calculate(standard,{currency:'USD',usdPerUnit:'1',source:'identity',date:'2026-11-12'}).cents,157);
  assert.equal(small.basis,'provisional_published_proceeds');assert.ok(small.sources?.length);
});
test('published price point requires exact product, territory, price, currency and effective schedule',()=>{
  for(const change of [{productId:'other'},{territory:'GBR'},{price:'9.99'},{currency:'EUR'},{startDate:'2026-11-13'},{endDate:'2026-11-12'}])assert.equal(matchPublished(event,[{...quote,...change}]),undefined);
  assert.equal(matchPublished(event,[]),undefined);assert.equal(matchPublished(event,[quote,{...quote,proceeds:'6.00'}]),undefined);
});
test('published non-USD proceeds use a sourced daily rate and one rounding',()=>{
  const e={...event,transaction:{...tx,storefront:'DEU',currency:'EUR'}};const net=matchPublished(e,[{...quote,territory:'DEU',currency:'EUR',proceeds:'6.42'}])!;
  const c=calculate(net,{currency:'EUR',usdPerUnit:'1.1',date:'2026-11-12',source:'synthetic ECB daily'});assert.equal(c.cents,177);assert.equal(c.sources.length,2);
});
test('price schedule API lookup selects the one-time offer price and preserves its Apple resource source',async()=>{
  const paths:string[]=[];const net=await publishedProceeds(event,async(path)=>{paths.push(path);return {data:[{type:'inAppPurchaseOfferCodePrices',id:'offer-price',relationships:{territory:{data:{type:'territories',id:'USA'}},pricePoint:{data:{type:'inAppPurchasePricePoints',id:'point'}}}}],included:[{type:'territories',id:'USA',attributes:{currency:'USD'}},{type:'inAppPurchasePricePoints',id:'point',attributes:{customerPrice:'8.99',proceeds:'7.64'}}]};});
  assert.equal(net?.amount,'7.64');assert.match(paths[0],/inAppPurchaseOfferCodes\/offer\/prices/);
});
test('one-time attribution cannot carry across a product or a renewal; free and family shared never pay',async()=>{
  const run=async(changes:object={},type='ONE_TIME_CHARGE')=>{const t={...tx,...changes};const n={notificationUUID:'fixture',notificationType:type,data:{bundleId:app.bundleId,appAppleId:app.appAppleId,environment:'Production',signedTransactionInfo:'jws'}};
    const service={verifier:{verifyAndDecodeNotification:async()=>n,verifyAndDecodeTransaction:async()=>t},client:{getTransactionInfo:async()=>({signedTransactionInfo:'lookup'}),getTransactionHistory:async()=>{throw Error('one-time must not use subscription history');}}} as unknown as AppleServices;
    return verifyEvent('header.'+Buffer.from(JSON.stringify(n)).toString('base64url')+'.sig',[app],()=>service);};
  assert.equal(eligibility(await run()),null);
  for(const change of [{price:0},{offerIdentifier:'other'},{productId:'other'},{inAppOwnershipType:'FAMILY_SHARED'},{revocationDate:purchase+1}])assert.ok(eligibility(await run(change)));
  assert.equal((await run({},'DID_RENEW')).attribution,undefined);
});
const financial:FinancialTransaction={transaction_id:'one',app:'test',product_id:'unlock',storefront:'USA',price_milliunits:8990,currency:'USD',purchase_ms:purchase,transaction_offer:'SAIIKHOTIC'};
const row:FinanceRow={row:2,appId:'123',productId:'unlock',country:'US',price:'8.99',customerCurrency:'USD',currency:'USD',proceeds:'7.50',quantity:1,start:'2026-11-01',end:'2026-11-30',date:'2026-11-12',offer:'SAIIKHOTIC',saleOrReturn:'S'};
test('monthly matching holds heterogeneous or mismatched rows and preserves proceeds currency',()=>{
  assert.equal(matchFinancial(financial,[row],123)?.amount,'7.50');
  assert.equal(matchFinancial(financial,[row,{...row,row:3,proceeds:'7.40'}],123),undefined);
  assert.equal(matchFinancial(financial,[{...row,productId:'other'}],123),undefined);
  assert.equal(matchFinancial(financial,[{...row,offer:'other'}],123),undefined);
  assert.equal(matchFinancial(financial,[{...row,date:'2026-11-13'}],123),undefined);
  assert.equal(matchFinancial(financial,[row,{...row,date:null}],123),undefined);
  assert.equal(matchFinancial(financial,[{...row,currency:'EUR'}],123)?.currency,'EUR');
  assert.equal(matchFinancial(financial,[{...row,start:'2026-12-01',end:'2026-12-31'}],123)?.amount,'7.50');
});
test('financial parser rejects incomplete identity and parses fiscal dates and net proceeds',()=>{
  const h=['Apple Identifier','Vendor Identifier','Country of Sale','Customer Price','Customer Currency','Partner Share','Partner Share Currency','Quantity','Start Date','End Date','Transaction Date','Sale or Return','Order Type'];
  const values=['123','unlock','US','8.99','USD','7.50','USD','1','11/01/2026','11/30/2026','11/12/2026','S','SAIIKHOTIC'];
  const rows=parseFinancialReport(h.join('\t')+'\n'+values.join('\t'));assert.equal(rows[0].date,'2026-11-12');assert.equal(rows[0].proceeds,'7.50');assert.throws(()=>parseFinancialReport('Title\tQuantity\nunlock\t1'),/HEADERS/);
});
