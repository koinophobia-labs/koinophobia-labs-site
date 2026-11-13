import type { EarningRule } from './earning-rules';
import type { VerifiedEvent } from './apple';
export type Fx = { currency: string; usdPerUnit: string; date: string; source: string };
export type Basis='provisional_published_proceeds'|'trued_up_financial_report';
export type NetProceeds = { transactionId: string; app: string; productId: string; storefront: string; currency: string; customerCurrency?:string; priceMilliunits: number; purchaseDate: number; amount: string; appleBasisPoints: number|null; source: string; verifiedAt: string; basis?:Basis; sources?:unknown[]; programEvidence?:string };
export type Calculation = { cents: number; priceMilliunits: number; currency: string; appleBasisPoints: number|null; affiliateBasisPoints: number; earningRule?: EarningRule; exactUsd: string; ownerExactUsd: string; exactCents: Fraction; precisionVersion?: 1; proceedsNumerator: string; proceedsDenominator: string; fx: Fx; rateEvidence: string; formula: string; proceeds: NetProceeds; basis:Basis; sources:unknown[] };
export function calculate(proceeds: NetProceeds, fx: Fx, rule?: EarningRule): Calculation {
  if (!/^(0|[1-9]\d*)(\.\d{1,12})?$/.test(proceeds.amount) || !proceeds.source || (proceeds.appleBasisPoints!==null&&(!Number.isInteger(proceeds.appleBasisPoints)||proceeds.appleBasisPoints<0||proceeds.appleBasisPoints>10000)) || fx.currency !== proceeds.currency || !fx.source || !Number.isFinite(Date.parse(fx.date)) || !/^\d+(\.\d{1,12})?$/.test(fx.usdPerUnit)) throw Error('MONEY_INVALID');
  const [whole,fraction=''] = fx.usdPerUnit.split('.');
  const numerator=BigInt(whole+fraction), denominator=BigInt(10)**BigInt(fraction.length);
  if (numerator <= BigInt(0)) throw Error('FX_INVALID');
  const [netWhole,netFraction='']=proceeds.amount.split('.');
  const net=BigInt(netWhole+netFraction),netDenominator=BigInt(10)**BigInt(netFraction.length);
  // Apple-reported net proceeds already subtract taxes and Apple's fee. Never
  // deduct that fee again. Round the affiliate's converted amount only once.
  const rate=rule?.partnerBasisPoints ?? 2500;
  const cost=decimalFraction(rule?.costDeduction ?? '0');
  if(!Number.isInteger(rate)||rate<0||rate>10000)throw Error('MONEY_INVALID');
  const available=net*BigInt(cost.denominator)-BigInt(cost.numerator)*netDenominator;
  const remaining=available>BigInt(0)?available:BigInt(0);
  const n=remaining*BigInt(rate)*numerator*BigInt(100), d=netDenominator*BigInt(cost.denominator)*denominator*BigInt(10000);
  const exactCents={numerator:n.toString(),denominator:d.toString()};
  const exactUsd=fractionDecimal(n,d*BigInt(100));
  const ownerExactUsd=fractionDecimal(remaining*BigInt(10000-rate)*numerator,d);
  const cents=Number((n+d/BigInt(2))/d);
  if (!Number.isSafeInteger(cents) || cents > 99999999) throw Error('MONEY_OVERFLOW');
  return {cents,priceMilliunits:proceeds.priceMilliunits,currency:proceeds.currency,appleBasisPoints:proceeds.appleBasisPoints,affiliateBasisPoints:rate,...(rule?{earningRule:rule,precisionVersion:1 as const}:{}),exactUsd,ownerExactUsd,exactCents,proceedsNumerator:net.toString(),proceedsDenominator:netDenominator.toString(),fx,rateEvidence:proceeds.source,formula:`max(0, Apple net proceeds − ${rule?.costDeduction ?? '0'} in proceeds currency) × ${rate}/10000 × daily USD rate; fractional cents retained; new earnings rounded together monthly`,proceeds,basis:proceeds.basis||'trued_up_financial_report',sources:[...(proceeds.sources||[proceeds.source]),fx]};
}
export function eligibility(e: VerifiedEvent): string | null {
  const t=e.transaction;
  if (!t) return 'no_transaction';
  if (e.environment !== 'Production') return 'sandbox';
  if (['REFUND','REVOKE'].includes(e.type) || t.revocationDate != null) return 'revoked';
  if (t.inAppOwnershipType !== 'PURCHASED') return 'not_purchased';
  if (!Number.isSafeInteger(t.price) || t.price! <= 0 || t.offerDiscountType === 'FREE_TRIAL') return 'free_or_missing_price';
  if (!e.attribution && !e.earningRule) return 'not_attributed';
  if (!t.currency || !/^[A-Z]{3}$/.test(t.currency)) return 'currency_missing';
  if (t.advancedCommerceInfo || t.commitmentInfo || t.billingPlanType) return 'unsupported_billing';
  return null;
}
export async function exchangeRate(currency: string, purchaseDate: number): Promise<Fx> {
  const date=new Date(purchaseDate).toISOString().slice(0,10);
  if (currency === 'USD') return {currency,usdPerUnit:'1',date,source:'USD identity'};
  if (!/^[A-Z]{3}$/.test(currency)) throw Error('FX_CURRENCY_INVALID');
  const source=`https://api.frankfurter.dev/v2/providers/ecb/rate/${currency.toLowerCase()}/usd?date=${date}`;
  const response=await fetch(source,{signal:AbortSignal.timeout(8000),cache:'no-store'});
  if (!response.ok) throw Error('FX_UNAVAILABLE');
  const data=await response.json();
  const age=Date.parse(date)-Date.parse(data.date);
  if (data.base?.toUpperCase() !== currency || data.quote?.toUpperCase() !== 'USD' || !Number.isFinite(data.rate) || data.rate <= 0 || !Number.isFinite(age) || age < 0 || age > 4*86400000) throw Error('FX_INVALID');
  return {currency,usdPerUnit:String(data.rate),date:data.date,source};
}

export type Fraction={numerator:string;denominator:string};
export function decimalFraction(value:string):Fraction {
  if(!/^(0|[1-9]\d*)(\.\d{1,12})?$/.test(value))throw Error('MONEY_INVALID');
  const [w,f='']=value.split('.');return {numerator:BigInt(w+f).toString(),denominator:(BigInt(10)**BigInt(f.length)).toString()};
}
export function fractionDecimal(n:bigint,d:bigint) {
  if(n<BigInt(0)||d<=BigInt(0))throw Error('MONEY_INVALID');
  let value=(n/d).toString(),rest=n%d;
  if(rest){value+='.';for(let i=0;rest&&i<64;i++){rest*=BigInt(10);value+=(rest/d).toString();rest%=d;}if(rest)throw Error('MONEY_PRECISION');}
  return value;
}
export function roundMonthlyAmounts(rows:{id:string;exactCents:Fraction}[]) {
  let numerator=BigInt(0),denominator=BigInt(1);
  const gcd=(a:bigint,b:bigint):bigint=>b?gcd(b,a%b):a;
  const parts=rows.map(row=>{
    const n=BigInt(row.exactCents.numerator),d=BigInt(row.exactCents.denominator);
    if(n<BigInt(0)||d<=BigInt(0))throw Error('MONEY_INVALID');
    numerator=numerator*d+n*denominator;denominator*=d;
    const g=gcd(numerator,denominator);numerator/=g;denominator/=g;
    return {id:row.id,cents:n/d,remainder:n%d,denominator:d};
  });
  const total=(numerator*BigInt(2)+denominator)/(BigInt(2)*denominator);
  let spare=total-parts.reduce((n,p)=>n+p.cents,BigInt(0));
  parts.sort((a,b)=>{const diff=a.remainder*b.denominator-b.remainder*a.denominator;return diff>BigInt(0)?-1:diff<BigInt(0)?1:a.id.localeCompare(b.id,'en');});
  for(const p of parts)if(spare>BigInt(0)){p.cents++;spare--;}
  return new Map(parts.map(p=>{const cents=Number(p.cents);if(!Number.isSafeInteger(cents)||cents>99999999)throw Error('MONEY_OVERFLOW');return [p.id,cents];}));
}
