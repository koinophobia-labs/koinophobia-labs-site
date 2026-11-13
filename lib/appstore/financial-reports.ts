import { reconcileMonthlyRounding } from './rounding';
import type { EarningRule } from './earning-rules';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import type {Queryable} from '../payments';
import type {Pool} from 'pg';
import {appleRequest} from './connect-api';
import {apps,required} from './config';
import {atomic,locked} from './ledger';
import {calculate,exchangeRate,type Calculation,type NetProceeds} from './money';
import {milliunits} from './published-proceeds';
import territories from './territories.json';
export type FinanceRow={row:number;appId:string;productId:string;country:string;price:string;customerCurrency:string;currency:string;proceeds:string;quantity:number;start:string;end:string;date:string|null;offer:string;saleOrReturn:string};
export type FinancialTransaction={transaction_id:string;app:string;product_id:string;storefront:string;price_milliunits:string|number;currency:string;purchase_ms:string|number;transaction_offer:string|null;original_id?:string;earning_rule?:EarningRule};
const hash=(s:string|Buffer)=>createHash('sha256').update(s).digest('hex');
function date(s:string):string {const m=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);if(!m)throw Error('FINANCE_DATE_INVALID');const iso=`${m[3]}-${m[1]}-${m[2]}`;if(new Date(iso).toISOString().slice(0,10)!==iso)throw Error('FINANCE_DATE_INVALID');return iso;}
export function parseFinancialReport(text:string):FinanceRow[] {
  const lines=text.replace(/^\uFEFF/,'').replace(/[\r\n]+$/,'').split(/\r?\n/),header=lines.shift()!.split('\t');
  const required=['Apple Identifier','Country of Sale','Customer Price','Customer Currency','Partner Share','Partner Share Currency','Quantity','Start Date','End Date','Sale or Return'];
  if(required.some(h=>!header.includes(h)))throw Error('FINANCE_HEADERS_INVALID');
  const productHeader=['Vendor Identifier','SKU','ISRC / ISBN','ISRC/ISBN'].find(h=>header.includes(h));
  // Never infer a product from display titles or an app-wide total.
  if(!productHeader)throw Error('FINANCE_PRODUCT_IDENTIFIER_MISSING');
  return lines.filter(Boolean).map((line,i)=>{const parts=line.split('\t');if(parts.length!==header.length)throw Error('FINANCE_ROW_INVALID');const r=Object.fromEntries(header.map((h,j)=>[h,parts[j].replace(/^"(.*)"$/,'$1')]));
    const quantity=Number(r.Quantity);if(!Number.isSafeInteger(quantity)||!quantity)throw Error('FINANCE_QUANTITY_INVALID');
    const price=r['Customer Price'].replace(/^-/,'');milliunits(price);const proceeds=r['Partner Share'];if(!/^\d+(\.\d{1,12})?$/.test(proceeds))throw Error('FINANCE_PROCEEDS_INVALID');
    return {row:i+2,appId:r['Apple Identifier'],productId:r[productHeader],country:r['Country of Sale'],price,customerCurrency:r['Customer Currency'],currency:r['Partner Share Currency'],proceeds,quantity,start:date(r['Start Date']),end:date(r['End Date']),date:r['Transaction Date']?date(r['Transaction Date']):null,offer:r['Order Type']||'',saleOrReturn:r['Sale or Return']};
  });
}
export function matchFinancial(t:FinancialTransaction,rows:FinanceRow[],appId:number) {
  const day=new Date(Number(t.purchase_ms)).toISOString().slice(0,10),country=(territories as Record<string,string>)[t.storefront];if(!country)return;
  const matches=rows.filter(r=>r.appId===String(appId)&&r.productId===t.product_id&&r.country===country&&r.customerCurrency===t.currency&&milliunits(r.price)===Number(t.price_milliunits)&&r.saleOrReturn==='S'&&r.quantity>0&&(r.date?r.date===day:r.start<=day&&r.end>=day)&&r.offer===(t.transaction_offer||''));
  if(!matches.length||new Set(matches.map(r=>r.currency+':'+r.proceeds)).size!==1)return;
  if(new Set(matches.map(r=>r.date||'undated')).size!==1||new Set(matches.map(r=>r.start+':'+r.end)).size!==1)return;
  // The group excludes proceeds so corrected reports reuse the same capacity.
  const groupKey=hash(JSON.stringify([t.app,t.product_id,country,t.price_milliunits.toString(),t.currency,t.transaction_offer||'',[matches[0].date,matches[0].start,matches[0].end]]));
  return {matches,groupKey,quantity:matches.reduce((n,r)=>n+r.quantity,0),amount:matches[0].proceeds,currency:matches[0].currency};
}
export async function applyTrueUp(q:Queryable,t:FinancialTransaction,calculation:Calculation,reportHash:string,month:string,groupKey:string) {
  return atomic(q,async()=>{
    if((await q.query('select 1 from appstore_financial_matches where transaction_id=$1 and report_hash=$2',[t.transaction_id,reportHash])).rows.length)return;
    if((await q.query('select 1 from appstore_adjustments where transaction_id=$1 and report_hash=$2',[t.transaction_id,reportHash])).rows.length)return;
    const existing=(await q.query('select * from appstore_commissions where transaction_id=$1 for update',[t.transaction_id])).rows[0];
    if(!existing){
      await q.query("insert into appstore_commissions(transaction_id,affiliate_id,usd_cents,calculation) values($1,'messiah',$2,$3)",[t.transaction_id,calculation.cents,JSON.stringify(calculation)]);
    }else{
      const d=(await q.query('select coalesce(sum(usd_cents),0)::int n from appstore_adjustments where transaction_id=$1',[t.transaction_id])).rows[0].n;
      const previous=existing.usd_cents+d;
      await q.query("insert into appstore_adjustments(transaction_id,report_hash,fiscal_month,usd_cents,previous_cents,final_cents,calculation,basis,sources) values($1,$2,$3,$4,$5,$6,$7,'trued_up_financial_report',$8)",[t.transaction_id,reportHash,month,calculation.cents-previous,previous,calculation.cents,JSON.stringify(calculation),JSON.stringify(calculation.sources)]);
    }
    await q.query('insert into appstore_verified_proceeds(transaction_id,basis) values($1,$2) on conflict(transaction_id) do update set basis=excluded.basis,verified_at=now()',[t.transaction_id,JSON.stringify(calculation.proceeds)]);
    await q.query('insert into appstore_financial_matches(transaction_id,fiscal_month,report_hash,group_key,sources) values($1,$2,$3,$4,$5) on conflict(transaction_id,fiscal_month) do update set report_hash=excluded.report_hash,group_key=excluded.group_key,sources=excluded.sources',[t.transaction_id,month,reportHash,groupKey,JSON.stringify(calculation.sources)]);
    await q.query('update appstore_transactions set reason=null where transaction_id=$1',[t.transaction_id]);
  });
}
export async function reconcileFinancial(q:Queryable,raw:Buffer,month:string,source:string,fx=exchangeRate) {
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))throw Error('FINANCE_MONTH_INVALID');
  if((await q.query("select 1 from appstore_payouts where status in ('pending','review') limit 1")).rows.length)throw Error('FINANCE_WAITING_FOR_TRANSFER_CONFIRMATION');
  const reportHash=hash(raw),rows=parseFinancialReport(raw.toString('utf8'));
  const seen=(await q.query('select 1 from appstore_financial_reports where report_hash=$1',[reportHash])).rows.length;
  const latest=(await q.query('select report_hash from appstore_financial_reports where fiscal_month=$1 order by fetched_at desc limit 1',[month])).rows[0];
  if(seen&&latest?.report_hash!==reportHash)return {status:'superseded_report',matched:0,held:0};
  await q.query('insert into appstore_financial_reports(report_hash,fiscal_month,source,row_count) values($1,$2,$3,$4) on conflict do nothing',[reportHash,month,source,rows.length]);
  const configured=apps();let matched=0,held=0;
  // Fiscal periods come from Apple, never from Gregorian month boundaries.
  const start=rows.map(r=>r.start).sort()[0],end=rows.map(r=>r.end).sort().at(-1);
  const transactions=(await q.query("select t.* from appstore_transactions t where affiliate_id='messiah' and environment='Production' and not revoked and price_milliunits>0 and (reason is null or reason in ('proceeds_unverified','proceeds_unavailable','proceeds_mismatch','fx_unavailable','financial_match_ambiguous')) order by purchase_ms,transaction_id")).rows as FinancialTransaction[];
  const known=(await q.query("select t.* from appstore_transactions t where environment='Production' and price_milliunits>0")).rows as FinancialTransaction[];
  const groups=new Map<string,number>();
  for(const t of known){const app=configured.find(a=>a.key===t.app);if(!app)continue;const m=matchFinancial(t,rows,app.appAppleId);if(m)groups.set(m.groupKey,(groups.get(m.groupKey)||0)+1);}
  for(const t of transactions){
    const day=new Date(Number(t.purchase_ms)).toISOString().slice(0,10);
    if(!start||!end||day<start||day>end)continue;
    if((await q.query('select 1 from appstore_financial_matches where transaction_id=$1 and report_hash=$2',[t.transaction_id,reportHash])).rows.length)continue;
    // A transaction settled in one fiscal report cannot consume another month.
    if((await q.query('select 1 from appstore_financial_matches where transaction_id=$1 and fiscal_month<>$2',[t.transaction_id,month])).rows.length)continue;
    const app=configured.find(a=>a.key===t.app);if(!app)continue;
    const match=matchFinancial(t,rows,app.appAppleId);if(!match){held++;continue;}
    if((groups.get(match.groupKey)||0)>match.quantity){held++;continue;}
    const used=(await q.query('select count(*)::int n from appstore_financial_matches where fiscal_month=$1 and group_key=$2 and transaction_id<>$3',[month,match.groupKey,t.transaction_id])).rows[0].n;
    if(used>=match.quantity){held++;continue;}
    const provenance={source,reportHash,fiscalMonth:month,rows:match.matches,match:'homogeneous published per-unit proceeds; aggregate report has no transaction ID'};
    const basis:NetProceeds={transactionId:t.transaction_id,app:t.app,productId:t.product_id,storefront:t.storefront,currency:match.currency,customerCurrency:t.currency,priceMilliunits:Number(t.price_milliunits),purchaseDate:Number(t.purchase_ms),amount:match.amount,appleBasisPoints:null,source,verifiedAt:new Date().toISOString(),basis:'trued_up_financial_report',sources:[provenance]};
    const prior=(await q.query('select calculation from appstore_commissions where transaction_id=$1',[t.transaction_id])).rows[0];
    const rule=(prior ? prior.calculation?.earningRule : t.earning_rule) as EarningRule|undefined;
    let calculation:Calculation;try{calculation=calculate(basis,await fx(match.currency,Number(t.purchase_ms)),rule);}catch{held++;continue;}
    await applyTrueUp(q,t,calculation,reportHash,month,match.groupKey);matched++;
  }
  await reconcileMonthlyRounding(q,month,reportHash);
  await q.query("update appstore_financial_reports set status=$2 where report_hash=$1",[reportHash,held?'complete_with_holds':'complete']);
  return {status:held?'complete_with_holds':'complete',matched,held};
}
export async function fetchFinancialMonth(month:string) {
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))throw Error('FINANCE_MONTH_INVALID');
  const vendor=required('APPSTORE_VENDOR_NUMBER');if(!/^\d{5,20}$/.test(vendor))throw Error('FINANCE_VENDOR_INVALID');
  const query=new URLSearchParams({'filter[reportType]':'FINANCE_DETAIL','filter[regionCode]':'Z1','filter[reportDate]':month,'filter[vendorNumber]':vendor});
  const data=await appleRequest('/v1/financeReports?'+query,true);
  const raw=data[0]===0x1f&&data[1]===0x8b?gunzipSync(data,{maxOutputLength:32_000_000}):data;
  return {raw,source:'https://api.appstoreconnect.apple.com/v1/financeReports?reportType=FINANCE_DETAIL&regionCode=Z1&reportDate='+month};
}
export async function monthlyTrueUp(database:Pool) {
  const now=new Date(),months=[1,2,3].map(n=>new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()-n,1)).toISOString().slice(0,7));
  const result=[];
  for(const month of months){
    let report;try{report=await fetchFinancialMonth(month);}catch(e){if(e instanceof Error&&e.message==='ASC_HTTP_404'){result.push({month,status:'not_available'});continue;}throw e;}
    result.push({month,...await locked(database,q=>reconcileFinancial(q,report.raw,month,report.source))});
  }return result;
}
