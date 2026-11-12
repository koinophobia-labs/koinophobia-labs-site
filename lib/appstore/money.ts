import type { VerifiedEvent } from './apple';
export type Fx = { currency: string; usdPerUnit: string; date: string; source: string };
export type Basis='provisional_published_proceeds'|'trued_up_financial_report';
export type NetProceeds = { transactionId: string; app: string; productId: string; storefront: string; currency: string; customerCurrency?:string; priceMilliunits: number; purchaseDate: number; amount: string; appleBasisPoints: number|null; source: string; verifiedAt: string; basis?:Basis; sources?:unknown[]; programEvidence?:string };
export type Calculation = { cents: number; priceMilliunits: number; currency: string; appleBasisPoints: number|null; affiliateBasisPoints: 2500; proceedsNumerator: string; proceedsDenominator: string; fx: Fx; rateEvidence: string; formula: string; proceeds: NetProceeds; basis:Basis; sources:unknown[] };
export function calculate(proceeds: NetProceeds, fx: Fx): Calculation {
  if (!/^(0|[1-9]\d*)(\.\d{1,12})?$/.test(proceeds.amount) || !proceeds.source || (proceeds.appleBasisPoints!==null&&(!Number.isInteger(proceeds.appleBasisPoints)||proceeds.appleBasisPoints<0||proceeds.appleBasisPoints>10000)) || fx.currency !== proceeds.currency || !fx.source || !Number.isFinite(Date.parse(fx.date)) || !/^\d+(\.\d{1,12})?$/.test(fx.usdPerUnit)) throw Error('MONEY_INVALID');
  const [whole,fraction=''] = fx.usdPerUnit.split('.');
  const numerator=BigInt(whole+fraction), denominator=BigInt(10)**BigInt(fraction.length);
  if (numerator <= BigInt(0)) throw Error('FX_INVALID');
  const [netWhole,netFraction='']=proceeds.amount.split('.');
  const net=BigInt(netWhole+netFraction),netDenominator=BigInt(10)**BigInt(netFraction.length);
  // Apple-reported net proceeds already subtract taxes and Apple's fee. Never
  // deduct that fee again. Round the affiliate's converted amount only once.
  const n=net*BigInt(25)*numerator, d=netDenominator*denominator;
  const cents=Number((n+d/BigInt(2))/d);
  if (!Number.isSafeInteger(cents) || cents > 99999999) throw Error('MONEY_OVERFLOW');
  return {cents,priceMilliunits:proceeds.priceMilliunits,currency:proceeds.currency,appleBasisPoints:proceeds.appleBasisPoints,affiliateBasisPoints:2500,proceedsNumerator:net.toString(),proceedsDenominator:netDenominator.toString(),fx,rateEvidence:proceeds.source,formula:'round(Apple net proceeds × 0.25 × daily USD rate × 100)',proceeds,basis:proceeds.basis||'trued_up_financial_report',sources:[...(proceeds.sources||[proceeds.source]),fx]};
}
export function eligibility(e: VerifiedEvent): string | null {
  const t=e.transaction;
  if (!t) return 'no_transaction';
  if (e.environment !== 'Production') return 'sandbox';
  if (['REFUND','REVOKE'].includes(e.type) || t.revocationDate != null) return 'revoked';
  if (t.inAppOwnershipType !== 'PURCHASED') return 'not_purchased';
  if (!Number.isSafeInteger(t.price) || t.price! <= 0 || t.offerDiscountType === 'FREE_TRIAL') return 'free_or_missing_price';
  if (!e.attribution) return 'not_attributed';
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
