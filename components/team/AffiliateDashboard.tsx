import Image from 'next/image';
import { AFFILIATE_STATUSES, affiliateDate, affiliateMoney, fiscalMonthLabel, type AffiliateDashboardData } from '@/lib/team/affiliate-view';
import { AffiliateControls, AffiliateCopy, AffiliateLogout } from './AffiliateControls';

export function AffiliateDashboard({ data, account }: { data: AffiliateDashboardData; account?: React.ReactNode }) {
  const month = fiscalMonthLabel(data.nextFiscalMonth);
  return <main className="affiliate-shell">
    <header className="affiliate-header">
      <div className="team-brand"><Image src="/brand/koi-emblem.svg" width={36} height={36} alt="" /><span>Koinophobia Labs</span></div>
      <AffiliateLogout />
    </header>
    {data.fake && <p className="team-notice">FAKE DATA · AFFILIATE REVIEW · Payments are disabled.</p>}
    <section className="affiliate-intro">
      <p className="team-eyebrow">YOUR APP STORE EARNINGS</p>
      <h1>{data.name}, your share.</h1>
      <p>Your app sales, earnings and payout progress in one place.</p>
    </section>
    <div className="affiliate-metrics">{data.earningRules.map(rule=><section className="team-card" key={rule.type}><h2>{rule.type==='revenue_share'?'Your apps':'Code sales'}: {rule.percentage}%</h2><p>of what Apple pays{Number(rule.costDeduction)>0?' after agreed costs':''}{rule.active?'':' · Inactive'}</p></section>)}</div>
    <div className="affiliate-metrics">
      <section className="team-card"><h2>Earned · total</h2><strong>{affiliateMoney(data.earned)}</strong><p>After refunds and monthly adjustments</p></section>
      <section className="team-card"><h2>Earned · this month</h2><strong>{affiliateMoney(data.thisMonth)}</strong><p>Purchases this calendar month · UTC</p></section>
      <section className="team-card"><h2>Awaiting payout</h2><strong>{affiliateMoney(data.owed)}</strong><p>Paid after Apple pays Koinophobia Labs</p></section>
      {data.owedBack > 0 && <section className="team-card affiliate-debt"><h2>Owed back</h2><strong>{affiliateMoney(data.owedBack)}</strong><p>Future earnings offset this balance after Apple pays. No automatic bank debit.</p></section>}
    </div>
    <section className="team-card affiliate-payout">
      <div><p className="team-eyebrow">NEXT PAYOUT</p><h2>{month ? `after Apple pays for ${month}` : data.owed > 0 ? 'After Apple pays · fiscal month pending' : data.owedBack > 0 ? 'Future earnings offset your balance' : 'No unpaid earnings yet'}</h2>
        <p>{data.connection === 'ready' ? 'Stripe is connected.' : data.connection === 'incomplete' ? 'Finish your Stripe setup to receive payouts.' : 'Connect your own Stripe account to receive payouts.'} Earnings remain owed until payout is available.</p>
      </div>
      <AffiliateControls connection={data.connection} readonly={data.fake} />
      <p className="team-fine">Code sales and your apps never stack. Both shares are calculated from what Apple pays. New fractional-cent earnings are rounded together monthly; financial reports may adjust amounts. Bank and tax details stay with Stripe.</p>
    </section>
    <section className="affiliate-section"><h2>Earned by app</h2><div className="affiliate-apps">
      {data.byApp.map(a => <div className="team-card" key={a.app}><h3>{a.app}</h3><strong>{affiliateMoney(a.amount)}</strong></div>)}
    </div></section>
    <section className="affiliate-section"><div className="team-section-title"><h2>Sales feed</h2><span className="team-tag">NEWEST FIRST · USD EARNINGS</span></div>
      {data.sales.length === 0 ? <div className="team-card"><h3>Your first verified sale will appear here.</h3><p>Share your links below. Free purchases and downloads do not earn commission.</p></div> :
        <ol className="affiliate-feed">{data.sales.map((sale, index) => <li className="team-card affiliate-sale" key={`${sale.date}-${index}`}>
          <div><h3>{sale.app}</h3><p>{sale.product}</p><p>{sale.earningType==='revenue_share'?'Your apps':'Code sales'} · {sale.percentage??25}%</p><time dateTime={sale.date}>{affiliateDate(sale.date)}</time></div>
          <div className="affiliate-sale-result"><strong>{affiliateMoney(sale.amount)}</strong><span className={`affiliate-status affiliate-status-${sale.status}`}>{AFFILIATE_STATUSES[sale.status]}</span></div>
        </li>)}</ol>}
      <p className="team-fine">Only your code sales and app earnings are shown. Buyer identities are never included. Paid entries may include earnings used to offset refunds. The feed shows the latest 200 entries; totals include all your earnings.</p>
    </section>
    <section className="affiliate-section"><div className="team-section-title"><h2>Your links</h2><span className="team-tag">SAIIKHOTIC</span></div>
      <p>Share a redemption link. Apple shows the current offer and eligibility before purchase.</p>
      <div className="affiliate-links">{data.links.map(link => <section className="team-card" key={link.app}><h3>{link.app}</h3><AffiliateCopy {...link}/></section>)}</div>
    </section>
    {account && <details className="affiliate-section"><summary>Sign-in settings</summary>{account}</details>}
  </main>;
}
