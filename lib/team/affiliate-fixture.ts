import { affiliateApps, affiliateLinks } from './affiliate-links';
import type { AffiliateDashboardData } from './affiliate-view';

// Explicit fake preview only. The production page never calls this helper.
export function affiliateFixture(): AffiliateDashboardData {
  return {
    name: 'Demo Affiliate', earned: 990, thisMonth: 990, owed: 0, owedBack: 710,
    nextFiscalMonth: '2026-11', connection: 'none', fake: true,
    byApp: affiliateApps.map(a => ({ app: a.app, amount: a.key === 'trendi' ? 620 : a.key === 'old-dog' ? 370 : 0 })),
    links: affiliateLinks('messiah'),
    sales: [
      { app: "Teacher's Pet Personal School", product: 'Family monthly', date: '2026-11-12T15:00:00Z', amount: -1250, status: 'refunded' },
      { app: 'Old Dog', product: 'All courses', date: '2026-11-12T14:00:00Z', amount: -80, status: 'adjusted' },
      { app: 'Trendi: Content Coach', product: 'Pro monthly', date: '2026-11-11T14:00:00Z', amount: 620, status: 'earned' },
      { app: 'Old Dog', product: 'All courses', date: '2026-11-10T14:00:00Z', amount: 450, status: 'paid' },
      { app: "Teacher's Pet Personal School", product: 'Family monthly', date: '2026-11-09T14:00:00Z', amount: 1250, status: 'paid' },
    ],
  };
}
