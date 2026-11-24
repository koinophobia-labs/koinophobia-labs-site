import Image from 'next/image';
import Link from 'next/link';
import { Banknote, LayoutDashboard, Link2, Receipt, ShieldCheck, Smartphone } from 'lucide-react';
import {
  AFFILIATE_STATUSES, AFFILIATE_TYPES, affiliateDate, affiliateMoney, appSummaries, filterSales,
  fiscalMonthLabel, monthLabel, monthlyEarnings, statusTotals,
  type AffiliateDashboardData, type AffiliateFilter, type AffiliateSale,
} from '@/lib/team/affiliate-view';
import { AffiliateControls, AffiliateCopy, AffiliateLogout, CopyText } from './AffiliateControls';

// Messiah's own Saiikhotic apps: not released yet (App Store Connect, 2026-11-24).
const OWNED_APPS_PENDING = ['Saiikhotic', 'Saiikhotic Network'];

import { AFFILIATE_SCREENS, type AffiliateScreen } from '@/lib/team/affiliate-view';
export { AFFILIATE_SCREENS, type AffiliateScreen };

const navigation = [
  ['overview', 'Overview', LayoutDashboard],
  ['sales', 'Sales', Receipt],
  ['apps', 'Apps', Smartphone],
  ['links', 'Links & codes', Link2],
  ['payouts', 'Payouts', Banknote],
  ['account', 'Account', ShieldCheck],
] as const;

const headings: Record<AffiliateScreen, [string, string]> = {
  overview: ['', 'Your app sales, earnings and payout progress in one place.'],
  sales: ['Every sale, as it lands.', 'Newest first. Filter by app, type or status.'],
  apps: ['How each app is doing.', 'Your earnings and share for every app you share.'],
  links: ['Share it. Get paid.', 'Your redemption links, ready to copy and post.'],
  payouts: ['Where your money is.', 'What you\'ve been paid, what\'s coming, and how it reaches you.'],
  account: ['Your account.', 'Manage how you sign in.'],
};

const href = (screen: AffiliateScreen) => (screen === 'overview' ? '/team/affiliate' : '/team/affiliate/' + screen);

export function AffiliatePortal({ screen, data, account, accountOpen = false, filter = {}, now = new Date() }: {
  screen: AffiliateScreen;
  data: AffiliateDashboardData;
  account?: React.ReactNode;
  accountOpen?: boolean;
  filter?: AffiliateFilter;
  now?: Date;
}) {
  const index = AFFILIATE_SCREENS.indexOf(screen);
  const shares = data.earningRules.filter((r) => r.active).map((r) => `${r.percentage}%`).join(' · ');
  return <div className="team-workspace affiliate-workspace">
    <aside className="team-sidebar">
      <Link href="/team/affiliate" className="team-wordmark">
        <Image src="/brand/koi-emblem.svg" width={44} height={44} alt="" />
        <span>Koinophobia Labs<small>Team</small></span>
      </Link>
      <p className="team-eyebrow">YOUR DESK</p>
      <nav aria-label="Affiliate workspace">
        {navigation.map(([id, label, Icon]) =>
          <Link key={id} href={href(id)} className={screen === id ? 'active' : ''} aria-current={screen === id ? 'page' : undefined}>
            <Icon size={18} /><span>{label}</span>{screen === id && <span className="nav-dot" />}
          </Link>)}
      </nav>
      <div className="team-sidebar-bottom">
        <div className="team-avatar">{data.name.slice(0, 1)}</div>
        <div><strong>{data.name}</strong><small>App partner{shares ? ` · ${shares}` : ''}</small></div>
        <AffiliateLogout />
      </div>
    </aside>
    <div className="team-main">
      <header className="team-topbar">
        <span>Koinophobia Labs · Team</span>
        <span className="team-status"><i />{data.fake ? 'FAKE DATA PREVIEW' : 'PRIVATE WORKSPACE'}</span>
      </header>
      <main className="team-content">
        <div className="team-page-heading">
          <div>
            <p className="team-eyebrow">{String(index + 1).padStart(2, '0')} / {navigation[index][1].toUpperCase()}</p>
            <h1>{screen === 'overview' ? `${data.name}, your share.` : headings[screen][0]}</h1>
            <p>{headings[screen][1]}</p>
          </div>
          <span className="team-outline-label">APP PARTNER</span>
        </div>
        {data.fake && <p className="team-notice">FAKE DATA · AFFILIATE REVIEW · Payments are disabled.</p>}
        {accountOpen && screen !== 'account' &&
          <p className="team-notice">No password yet. <Link href={href('account')}>Set one in Account</Link> so you can sign in without an email link.</p>}
        {screen === 'overview' && <Overview data={data} now={now} />}
        {screen === 'sales' && <Sales data={data} filter={filter} />}
        {screen === 'apps' && <Apps data={data} />}
        {screen === 'links' && <Links data={data} />}
        {screen === 'payouts' && <Payouts data={data} />}
        {screen === 'account' && <section className="affiliate-section">{account}</section>}
      </main>
    </div>
  </div>;
}

function Metrics({ data }: { data: AffiliateDashboardData }) {
  return <div className="affiliate-metrics">
    <section className="team-card"><h2>Earned · total</h2><strong>{affiliateMoney(data.earned)}</strong><p>After refunds and monthly adjustments</p></section>
    <section className="team-card"><h2>Earned · this month</h2><strong>{affiliateMoney(data.thisMonth)}</strong><p>Purchases this calendar month · UTC</p></section>
    <section className="team-card"><h2>Awaiting payout</h2><strong>{affiliateMoney(data.owed)}</strong><p>Paid after Apple pays Koinophobia Labs</p></section>
    {data.owedBack > 0 && <section className="team-card affiliate-debt"><h2>Owed back</h2><strong>{affiliateMoney(data.owedBack)}</strong><p>Future earnings offset this balance after Apple pays. No automatic bank debit.</p></section>}
  </div>;
}

function Overview({ data, now }: { data: AffiliateDashboardData; now: Date }) {
  const months = monthlyEarnings(data.sales, 12, now);
  const peak = Math.max(1, ...months.map((m) => m.amount));
  const top = appSummaries(data).slice(0, 3);
  return <>
    <Metrics data={data} />
    <section className="team-card affiliate-chart-card">
      <div className="team-section-title"><h2>Earnings by month</h2><span className="team-tag">LAST 12 MONTHS · UTC</span></div>
      <ol className="affiliate-chart" aria-label="Earnings by month">
        {months.map((m) => <li key={m.month} title={`${monthLabel(m.month)}: ${affiliateMoney(m.amount)}`}>
          <span className="affiliate-bar" style={{ height: `${Math.max(2, (m.amount / peak) * 100)}%` }} />
          <small>{monthLabel(m.month)}</small>
          <span className="sr-only">{monthLabel(m.month)} {affiliateMoney(m.amount)}</span>
        </li>)}
      </ol>
      <p className="team-fine">Net of refunds and adjustments. Built from your latest 200 entries.</p>
    </section>
    <div className="affiliate-split">
      <section className="team-card">
        <div className="team-section-title"><h2>Top apps</h2><Link className="team-tag" href={href('apps')}>ALL APPS</Link></div>
        {top.length === 0 ? <p>No app earnings yet.</p> :
          <ul className="affiliate-list">{top.map((a) => <li key={a.app}><span>{a.app}</span><strong>{affiliateMoney(a.amount)}</strong></li>)}</ul>}
      </section>
      <section className="team-card">
        <div className="team-section-title"><h2>Latest sales</h2><Link className="team-tag" href={href('sales')}>ALL SALES</Link></div>
        {data.sales.length === 0 ? <p>Your first verified sale will appear here.</p> :
          <ul className="affiliate-list">{data.sales.slice(0, 5).map((s, i) => <li key={`${s.date}-${i}`}>
            <span>{s.app}<small>{affiliateDate(s.date)}</small></span><strong>{affiliateMoney(s.amount)}</strong></li>)}</ul>}
      </section>
    </div>
    <CodeCard data={data} compact />
    <NextPayout data={data} />
  </>;
}

function SaleRow({ sale }: { sale: AffiliateSale }) {
  return <li className="team-card affiliate-sale">
    <div><h3>{sale.app}</h3><p>{sale.product}</p>
      <p>{AFFILIATE_TYPES[sale.earningType ?? 'affiliate_commission']} · {sale.percentage ?? 25}%</p>
      <time dateTime={sale.date}>{affiliateDate(sale.date)}</time></div>
    <div className="affiliate-sale-result"><strong>{affiliateMoney(sale.amount)}</strong>
      <span className={`affiliate-status affiliate-status-${sale.status}`}>{AFFILIATE_STATUSES[sale.status]}</span></div>
  </li>;
}

function Sales({ data, filter }: { data: AffiliateDashboardData; filter: AffiliateFilter }) {
  const apps = [...new Set(data.sales.map((s) => s.app))].sort();
  const rows = filterSales(data.sales, filter);
  const total = rows.reduce((sum, s) => sum + s.amount, 0);
  return <section className="affiliate-section">
    <form className="affiliate-filters" method="get" action={href('sales')}>
      <label>App<select name="app" defaultValue={filter.app ?? ''}><option value="">All apps</option>{apps.map((a) => <option key={a}>{a}</option>)}</select></label>
      <label>Type<select name="type" defaultValue={filter.type ?? ''}><option value="">All types</option>
        {Object.entries(AFFILIATE_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
      <label>Status<select name="status" defaultValue={filter.status ?? ''}><option value="">All statuses</option>
        {Object.entries(AFFILIATE_STATUSES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
      <button className="secondary">Apply</button>
      <Link className="text-button" href={href('sales')}>Clear</Link>
    </form>
    <p className="affiliate-filter-summary">{rows.length} {rows.length === 1 ? 'sale' : 'sales'} · {affiliateMoney(total)} net</p>
    {rows.length === 0 ? <div className="team-card"><h3>{data.sales.length === 0 ? 'Your first verified sale will appear here.' : 'No sales match these filters.'}</h3>
      <p>Free purchases and downloads do not earn commission.</p></div> :
      <ol className="affiliate-feed">{rows.map((s, i) => <SaleRow key={`${s.date}-${i}`} sale={s} />)}</ol>}
    <p className="team-fine">Only your code sales and app earnings are shown. Buyer identities are never included. The feed shows your latest 200 entries; totals elsewhere include all your earnings.</p>
  </section>;
}

function Apps({ data }: { data: AffiliateDashboardData }) {
  const apps = appSummaries(data);
  return <>
    <div className="affiliate-metrics">{data.earningRules.map((rule) => <section className="team-card" key={rule.type}>
      <h2>{AFFILIATE_TYPES[rule.type]}: {rule.percentage}%</h2>
      <p>of what Apple pays{Number(rule.costDeduction) > 0 ? ' after agreed costs' : ''}{rule.active ? '' : ' · Inactive'}</p></section>)}</div>
    <p className="team-fine">Code sales and your apps never stack. Both shares are calculated from what Apple pays.</p>
    <section className="affiliate-section"><div className="affiliate-app-grid">
      {apps.length === 0 ? <div className="team-card"><h3>No apps yet.</h3></div> : apps.map((a) => <section className="team-card affiliate-app" key={a.app}>
        <h3>{a.app}</h3>
        <strong>{affiliateMoney(a.amount)}</strong>
        <p>{a.count} {a.count === 1 ? 'sale' : 'sales'}{a.last ? ` · last ${affiliateDate(a.last)}` : ''}</p>
        <div className="affiliate-app-actions">
          <Link className="text-button" href={`${href('sales')}?app=${encodeURIComponent(a.app)}`}>See sales</Link>
          {a.link && <Link className="text-button" href={href('links')}>Get link</Link>}
        </div>
      </section>)}
    </div></section>
  </>;
}

/** The shared offer code, read from the user's own redemption links. */
function offerCode(data: AffiliateDashboardData) {
  try { return data.links[0] ? new URL(data.links[0].url).searchParams.get('code') : null; } catch { return null; }
}

function CodeCard({ data, compact = false }: { data: AffiliateDashboardData; compact?: boolean }) {
  const code = offerCode(data);
  if (!code) return null;
  const all = data.links.map((l) => `${l.app}: ${l.url}`).join('\n');
  return <section className="team-card affiliate-code-card">
    <p className="team-eyebrow">YOUR CODE</p>
    <div className="affiliate-code-row"><strong className="affiliate-code">{code}</strong><CopyText value={code} label="Copy your code" button="Copy code" /></div>
    <p>Works on {data.links.length} apps. Buyers can tap a link below, or type {code} on Apple&apos;s offer-code page.</p>
    <div className="affiliate-code-actions">
      <CopyText value={all} label="Copy all your links" button={`Copy all ${data.links.length} links`} />
      {compact && <Link className="text-button" href={href('links')}>See every link</Link>}
    </div>
  </section>;
}

function Links({ data }: { data: AffiliateDashboardData }) {
  const ownsApps = data.earningRules.some((r) => r.type === 'revenue_share' && r.active);
  return <>
    <CodeCard data={data} />
    <section className="affiliate-section">
      {data.links.length === 0 ? <div className="team-card"><h3>No links yet.</h3><p>Ask Blake to add your redemption links.</p></div> :
        <div className="affiliate-links">{data.links.map((link) => <section className="team-card" key={link.app}><h3>{link.app}</h3><AffiliateCopy {...link} /></section>)}</div>}
    </section>
    {ownsApps && <section className="affiliate-section">
      <div className="team-section-title"><h2>Your own apps</h2><span className="team-tag">COMING SOON</span></div>
      <div className="affiliate-links">{OWNED_APPS_PENDING.map((app) => <section className="team-card" key={app}>
        <h3>{app}</h3><p>Not on the App Store yet. Its link appears here the day it goes live. You earn on every sale of your own apps, no code needed.</p>
      </section>)}</div>
    </section>}
    <section className="team-card affiliate-tips">
      <h2>Posting tips</h2>
      <ul>
        <li>Put the link in your bio and pin it during streams.</li>
        <li>Say what the app does for the viewer in one line, then drop the link.</li>
        <li>Apple shows the current offer and eligibility before anyone pays.</li>
        <li>Free downloads don&apos;t earn; paid purchases and subscriptions do.</li>
      </ul>
    </section>
  </>;
}

function NextPayout({ data }: { data: AffiliateDashboardData }) {
  const month = fiscalMonthLabel(data.nextFiscalMonth);
  return <section className="team-card affiliate-payout">
    <div><p className="team-eyebrow">NEXT PAYOUT</p>
      <h2>{month ? `after Apple pays for ${month}` : data.owed > 0 ? 'After Apple pays · fiscal month pending' : data.owedBack > 0 ? 'Future earnings offset your balance' : 'No unpaid earnings yet'}</h2>
      <p>{data.connection === 'ready' ? 'Stripe is connected.' : data.connection === 'incomplete' ? 'Finish your Stripe setup to receive payouts.' : 'Connect your own Stripe account to receive payouts.'} Earnings remain owed until payout is available.</p>
    </div>
    <AffiliateControls connection={data.connection} readonly={data.fake} />
  </section>;
}

function Payouts({ data }: { data: AffiliateDashboardData }) {
  const totals = statusTotals(data.sales);
  const paid = data.sales.filter((s) => s.status === 'paid');
  return <>
    <NextPayout data={data} />
    <div className="affiliate-metrics affiliate-section">
      {(Object.keys(AFFILIATE_STATUSES) as (keyof typeof AFFILIATE_STATUSES)[]).map((status) =>
        <section className="team-card" key={status}><h2>{AFFILIATE_STATUSES[status]}</h2>
          <strong>{affiliateMoney(totals[status].amount)}</strong><p>{totals[status].count} {totals[status].count === 1 ? 'entry' : 'entries'}</p></section>)}
    </div>
    {data.owedBack > 0 && <p className="team-notice">Owed back: {affiliateMoney(data.owedBack)}. Future earnings offset this balance after Apple pays. No automatic bank debit.</p>}
    <section className="affiliate-section">
      <div className="team-section-title"><h2>Paid history</h2><span className="team-tag">NEWEST FIRST</span></div>
      {paid.length === 0 ? <div className="team-card"><h3>No payouts yet.</h3><p>Paid entries appear here once Apple pays and your payout is sent.</p></div> :
        <ol className="affiliate-feed">{paid.map((s, i) => <SaleRow key={`${s.date}-${i}`} sale={s} />)}</ol>}
      <p className="team-fine">Figures on this screen come from your latest 200 entries. New fractional-cent earnings are rounded together monthly; financial reports may adjust amounts. Bank and tax details stay with Stripe.</p>
    </section>
  </>;
}
