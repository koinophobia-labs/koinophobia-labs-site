import type {VerifiedEvent} from './apple';
import type {NetProceeds} from './money';
import {document,resources} from './connect-api';
export type PublishedQuote={productId:string;territory:string;currency:string;price:string;proceeds:string;pricePointId:string;scheduleId:string;source:string;fetchedAt:string;startDate?:string;endDate?:string};
export function milliunits(value:string){if(!/^\d+(\.\d{1,3})?$/.test(value))throw Error('PRICE_INVALID');const [w,f='']=value.split('.');const n=Number(BigInt(w)*BigInt(1000)+BigInt(f.padEnd(3,'0')));if(!Number.isSafeInteger(n))throw Error('PRICE_INVALID');return n;}
export function matchPublished(e:VerifiedEvent,quotes:PublishedQuote[]):NetProceeds|undefined {
  const t=e.transaction;if(!t)return;
  const date=new Date(t.purchaseDate!).toISOString().slice(0,10);
  const found=quotes.filter(q=>q.productId===t.productId&&q.territory===t.storefront&&q.currency===t.currency&&milliunits(q.price)===t.price&&(!q.startDate||q.startDate<=date)&&(!q.endDate||q.endDate>date));
  if(!found.length||new Set(found.map(q=>q.proceeds)).size!==1)return;
  const q=found[0];
  return {transactionId:t.transactionId!,app:e.app.key,productId:t.productId!,storefront:t.storefront!,currency:q.currency,customerCurrency:t.currency!,priceMilliunits:t.price!,purchaseDate:t.purchaseDate!,amount:q.proceeds,appleBasisPoints:null,source:q.source,verifiedAt:q.fetchedAt,basis:'provisional_published_proceeds',sources:found,programEvidence:'Account-specific ASC proceeds includes Apple commission and applicable taxes; no additional fee deducted.'};
}
export async function publishedProceeds(e:VerifiedEvent,read=document):Promise<NetProceeds|undefined> {
  const t=e.transaction!,p=e.app.products?.find(p=>p.id===t.productId);if(!p||!t.storefront)return;
  const paths:string[]=[];
  // Offer and regular schedule are both bound to this configured product. Never
  // infer net proceeds from gross price or use an unrelated catalog tier.
  if(t.offerType===3&&e.app.offerIdentifiers.includes(t.offerIdentifier||''))paths.push(p.kind==='subscription'?`/v1/subscriptionOfferCodes/${p.offerId}/prices?include=subscriptionPricePoint,territory&limit=200`:`/v1/inAppPurchaseOfferCodes/${p.offerId}/prices?include=pricePoint,territory&limit=200`);
  if(p.kind==='subscription')paths.push(`/v1/subscriptions/${p.resourceId}/prices?filter[territory]=${t.storefront}&include=subscriptionPricePoint,territory&limit=200`);
  else if(!paths.length) {
    const d=await read(`/v2/inAppPurchases/${p.resourceId}/iapPriceSchedule`);if(Array.isArray(d.data))throw Error('SCHEDULE_INVALID');
    for(const kind of ['manualPrices','automaticPrices'])paths.push(`/v1/inAppPurchasePriceSchedules/${d.data.id}/${kind}?include=inAppPurchasePricePoint,territory&limit=200`);
  }
  const quotes:PublishedQuote[]=[];
  for(const path of paths){const {rows,included}=await resources(path,read);for(const r of rows){const rel=r.relationships||{},territory=rel.territory?.data?.id;if(territory!==t.storefront)continue;
    const pointRef=rel.subscriptionPricePoint?.data||rel.pricePoint?.data||rel.inAppPurchasePricePoint?.data;
    const point=pointRef&&included.get(pointRef.type+':'+pointRef.id);const attrs=point?.attributes;
    const region=included.get('territories:'+territory);
    if(!attrs||typeof attrs.customerPrice!=='string'||typeof attrs.proceeds!=='string'||typeof region?.attributes?.currency!=='string')continue;
    const a=r.attributes||{};
    quotes.push({productId:p.id,territory,currency:region.attributes.currency,price:attrs.customerPrice,proceeds:attrs.proceeds,pricePointId:point!.id,scheduleId:r.id,source:'https://api.appstoreconnect.apple.com'+path,fetchedAt:new Date().toISOString(),...(typeof a.startDate==='string'?{startDate:a.startDate}:{}),...(typeof a.endDate==='string'?{endDate:a.endDate}:{})});
  }}
  return matchPublished(e,quotes);
}
