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
  earningType?: 'affiliate_commission' | 'revenue_share';
  percentage?: number;
};
export type AffiliateDashboardData = {
  name: string;
  earningRules: { type: 'affiliate_commission' | 'revenue_share'; percentage: number; active: boolean; costDeduction: string }[];
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

// ---- Portal helpers (pure; display rows only, never buyer data) ----
export const AFFILIATE_SCREENS = ['overview', 'sales', 'apps', 'links', 'payouts', 'account'] as const;
export type AffiliateScreen = (typeof AFFILIATE_SCREENS)[number];
export type AffiliateFilter = { app?: string; type?: string; status?: string };
export const AFFILIATE_TYPES = { revenue_share: 'Your apps', affiliate_commission: 'Code sales' } as const;

/** Earnings per UTC calendar month, oldest first, ending with `now`'s month. */
export function monthlyEarnings(sales: AffiliateSale[], months = 12, now = new Date()) {
  const keys: string[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    keys.push(d.toISOString().slice(0, 7));
  }
  const totals = new Map(keys.map((k) => [k, 0]));
  for (const sale of sales) {
    const key = sale.date.slice(0, 7);
    // Refunds and adjustments are signed entries, so summing gives net earnings.
    if (totals.has(key)) totals.set(key, totals.get(key)! + sale.amount);
  }
  return keys.map((month) => ({ month, amount: totals.get(month)! }));
}

export function monthLabel(month: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }).format(new Date(month + '-15T12:00:00Z'));
}

/** Unknown filter values are ignored rather than hiding everything. */
export function filterSales(sales: AffiliateSale[], filter: AffiliateFilter) {
  return sales.filter((sale) =>
    (!filter.app || sale.app === filter.app) &&
    (!filter.type || !(filter.type in AFFILIATE_TYPES) || (sale.earningType ?? 'affiliate_commission') === filter.type) &&
    (!filter.status || !(filter.status in AFFILIATE_STATUSES) || sale.status === filter.status));
}

export function statusTotals(sales: AffiliateSale[]) {
  const totals = Object.fromEntries(Object.keys(AFFILIATE_STATUSES).map((k) => [k, { count: 0, amount: 0 }])) as
    Record<AffiliateStatus, { count: number; amount: number }>;
  for (const sale of sales) { totals[sale.status].count += 1; totals[sale.status].amount += sale.amount; }
  return totals;
}

/** Per-app view: total, sale count and most recent sale, highest earner first. */
export function appSummaries(data: Pick<AffiliateDashboardData, 'byApp' | 'sales' | 'links'>) {
  const names = new Set([...data.byApp.map((a) => a.app), ...data.links.map((l) => l.app)]);
  return [...names].map((app) => {
    const sales = data.sales.filter((s) => s.app === app);
    return {
      app,
      amount: data.byApp.find((a) => a.app === app)?.amount ?? 0,
      count: sales.filter((s) => s.amount > 0).length,
      last: sales.map((s) => s.date).sort().at(-1) ?? null,
      link: data.links.find((l) => l.app === app)?.url ?? null,
    };
  }).sort((a, b) => b.amount - a.amount || a.app.localeCompare(b.app));
}
