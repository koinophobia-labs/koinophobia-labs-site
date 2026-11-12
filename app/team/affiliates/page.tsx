import ReceiptForm from './ReceiptForm';
import {monthlyStatus} from '@/lib/appstore/monthly-status';
import Link from 'next/link';
import {notFound,redirect} from 'next/navigation';
import {currentPartner} from '@/lib/team/session';
import {hostedPreview,teamDatabase} from '@/lib/team/db';
import {ownerSnapshot} from '@/lib/appstore/ledger';
const usd=(c:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(c/100);
export default async function Affiliates(){
  const actor=await currentPartner();if(!actor)redirect('/team');if(actor.role!=='owner')notFound();
  if(hostedPreview()||process.env.APPSTORE_NOTIFICATIONS_ENABLED!=='true')return <main><h1>App Store affiliates</h1><p>Sales data is unavailable in this environment.</p></main>;
  const data=await ownerSnapshot(teamDatabase(),actor);
  const financeReady=['APPSTORE_REPORTS_KEY_ID','APPSTORE_REPORTS_ISSUER_ID','APPSTORE_REPORTS_PRIVATE_KEY','APPSTORE_VENDOR_NUMBER'].every(k=>!!process.env[k]);
  return <main className="team-workspace" style={{display:'block',padding:'clamp(20px,5vw,64px)',maxWidth:1200,margin:'auto'}}>
    <Link href="/team">← Team</Link><h1>Messiah · App Store commissions</h1>
    <p>25% of Apple’s published proceeds on verified paid SAIIKHOTIC purchases. Amounts accrue immediately as earned (awaiting Apple’s payment). Payouts run monthly only after Blake confirms Apple’s payment was received and final proceeds are reconciled. Connecting Stripe alone never releases a payout.</p>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:24,margin:'32px 0'}}>
      {([['Commission',data.summary.commission],['Paid, after reversals',data.summary.paid],['Earned (awaiting Apple’s payment)',data.summary.awaitingApple],['Ready after Apple payment',data.summary.ready],['Owed back',data.summary.owedBack]] as const).map(([label,n])=><section key={label}><h2 style={{fontSize:16}}>{label}</h2><strong style={{fontSize:28}}>{usd(n)}</strong></section>)}
    </div>
    <p>Owed back offsets future payouts. No automatic debit is made from Messiah’s bank account. Free purchases earn nothing.</p>
    {!financeReady&&<p role="status">Monthly true-up needs the App Store Connect vendor number and a key with Finance access. Provisional amounts remain clearly marked until reports can be read.</p>}
    {!!data.holds&&<p role="status">{data.holds} purchases are held pending matching Apple proceeds or a daily exchange rate.</p>}
    {!!data.review&&<p role="status">{data.review} transfer operations need confirmation. New transfers pause while a result is uncertain.</p>}
    <h2>Monthly payout</h2><ReceiptForm/>
    <div style={{overflowX:'auto'}}><table style={{width:'100%',minWidth:600,textAlign:'left',borderSpacing:'16px 12px'}}><thead><tr><th>Apple fiscal month</th><th>Apple receipt confirmed</th><th>Payout</th><th>Status</th></tr></thead><tbody>{data.months.map(m=><tr key={m.fiscal_month}><td>{m.fiscal_month}</td><td>{new Date(m.received_at).toISOString().slice(0,10)}</td><td>{usd(Number(m.usd_cents))}</td><td>{monthlyStatus(m.status,Number(m.usd_cents),Number(m.withheld_cents),m.error_code)}</td></tr>)}</tbody></table></div>
    <h2>Attributed purchases</h2>{!data.sales.length&&<p>No verified code purchases recorded yet.</p>}
    <div style={{overflowX:'auto'}}><table style={{width:'100%',textAlign:'left',borderSpacing:'0 16px'}}><thead><tr><th>App / date</th><th>Purchase</th><th>Commission</th><th>Payment</th><th>Basis and sources</th></tr></thead><tbody>
    {data.sales.map((s,i)=><tr key={i}><td>{s.app}<br/>{new Date(Number(s.purchase_ms)).toISOString().slice(0,10)}</td><td>{Number(s.price_milliunits)/1000} {s.currency}</td><td>{s.usd_cents==null?'Held':usd(Number(s.usd_cents)+Number(s.adjustment_cents))}{s.revoked?' · reversed':''}<br/>True-up: {usd(Number(s.adjustment_cents))}</td><td>{s.revoked?'Refunded':Number(s.monthly_paid||0)+Number(s.transferred_cents||0)>0?(Number(s.monthly_paid||0)+Number(s.transferred_cents||0)<Number(s.usd_cents)+Number(s.adjustment_cents)?'Paid in part; adjustment pending':'Paid'):s.reason?'Held for reconciliation':s.monthly_status?'Apple payment received; payout pending':'Earned (awaiting Apple’s payment)'}</td><td>{s.calculation&&<details><summary>{s.calculation.basis==='provisional_published_proceeds'?'Provisional published proceeds':'Financial report'}</summary><p>{s.calculation.formula}</p><p>Apple proceeds: {s.calculation.proceeds.amount} {s.calculation.currency}. USD rate: {s.calculation.fx.usdPerUnit}, dated {s.calculation.fx.date}.</p><p>{s.calculation.proceeds.source}</p></details>}</td></tr>)}
    </tbody></table></div>
    <h2>Verified notification receipts</h2><ul>{data.receipts.map((r,i)=><li key={i}>{r.app} · {r.environment} · {r.kind} · {new Date(r.verified_at).toISOString()}</li>)}</ul>
  </main>;
}
