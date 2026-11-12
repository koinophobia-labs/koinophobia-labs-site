// The browser contract contains only the partner's own aggregate earnings and
// buyer-free display rows. Never spread raw App Store or payment records here.
export const AFFILIATE_STATUSES = {
  earned: "Earned (awaiting Apple's payment)",
  paid: "Paid",
  adjusted: "Adjusted (monthly true-up)",
  refunded: "Refunded",
} as const;
export type AffiliateStatus = keyof typeof AFFILIATE_STATUSES;
export type AffiliateSale = {
  app: string;
  product: string;
  date: string;
  amount: number;
  status: AffiliateStatus;
};
export type AffiliateDashboardData = {
  name: string;
  earned: number;
  thisMonth: number;
  owed: number;
  owedBack: number;
  nextFiscalMonth: string | null;
  byApp: { app: string; amount: number }[];
  sales: AffiliateSale[];
  links: { app: string; url: string }[];
  connection: 'none' | 'incomplete' | 'ready';
  fake: boolean;
};
export const affiliateMoney = (cents: number) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD',
}).format(cents / 100);
export const affiliateDate = (value: string) => new Intl.DateTimeFormat('en-US', {
  year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC',
}).format(new Date(value));
export function fiscalMonthLabel(value: string | null) {
  if (!value) return null;
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) throw Error('INVALID_FISCAL_MONTH');
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(value + '-15T12:00:00Z'));
}
