import test from 'node:test';
import assert from 'node:assert/strict';
import { affiliateFixture } from '../lib/team/affiliate-fixture';
import { AFFILIATE_SCREENS, appSummaries, filterSales, monthlyEarnings, statusTotals } from '../lib/team/affiliate-view';

const data = affiliateFixture();
const now = new Date('2026-11-24T12:00:00Z');

test('monthly earnings cover 12 UTC months ending now, net of refunds', () => {
  const months = monthlyEarnings(data.sales, 12, now);
  assert.equal(months.length, 12);
  assert.equal(months[0].month, '2025-12');
  assert.equal(months.at(-1)!.month, '2026-11');
  // 620 + 450 + 1250 - 1250 (refund) - 80 (adjustment)
  assert.equal(months.at(-1)!.amount, 990);
  assert.ok(months.slice(0, -1).every((m) => m.amount === 0));
});

test('sales filters combine and ignore unknown values', () => {
  assert.equal(filterSales(data.sales, { app: 'Old Dog' }).length, 2);
  assert.equal(filterSales(data.sales, { status: 'paid' }).length, 2);
  assert.equal(filterSales(data.sales, { app: 'Old Dog', status: 'paid' }).length, 1);
  assert.equal(filterSales(data.sales, { status: 'not-a-status' }).length, data.sales.length);
  assert.equal(filterSales(data.sales, { type: 'revenue_share' }).length, 0);
  assert.equal(filterSales(data.sales, { type: 'affiliate_commission' }).length, data.sales.length, 'untyped rows are code sales');
});

test('status totals count and sum each status', () => {
  const totals = statusTotals(data.sales);
  assert.deepEqual(totals.paid, { count: 2, amount: 1700 });
  assert.deepEqual(totals.refunded, { count: 1, amount: -1250 });
  assert.deepEqual(totals.earned, { count: 1, amount: 620 });
});

test('app summaries rank by earnings and include every linked app', () => {
  const apps = appSummaries(data);
  assert.equal(apps[0].amount >= apps[1].amount, true);
  const names = new Set(apps.map((a) => a.app));
  for (const link of data.links) assert.ok(names.has(link.app));
  const oldDog = apps.find((a) => a.app === 'Old Dog')!;
  assert.equal(oldDog.count, 1, 'adjustments are not counted as sales');
  assert.equal(oldDog.last, '2026-11-12T14:00:00Z');
});

test('portal has the six agreed screens', () => {
  assert.deepEqual([...AFFILIATE_SCREENS], ['overview', 'sales', 'apps', 'links', 'payouts', 'account']);
});
