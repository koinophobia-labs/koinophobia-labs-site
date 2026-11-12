import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
import { Pool } from 'pg';
import { affiliateSnapshot } from '../lib/team/affiliate-store';
import { affiliateLinks } from '../lib/team/affiliate-links';
import { partnerHome, requirePartnerAction, requireSalesPartner } from '../lib/team/affiliate-access';
import { AFFILIATE_STATUSES } from '../lib/team/affiliate-view';
import { invite, requestMagicLink } from '../lib/team/auth';
import { onboard } from '../lib/team/connect';
import type { Partner } from '../lib/team/types';
import type Stripe from 'stripe';

const partner = (id: string, role: Partner['role'] = 'affiliate'): Partner => ({
  id, name: 'Fictional affiliate', role, active: true, parent_partner_id: null, commission_rate: .25, override_rate: 0,
});

test('affiliate access denies sales capabilities and preserves owner/caller navigation', () => {
  const p = partner('fake-a');
  assert.equal(partnerHome(p), '/team/affiliate');
  for (const role of ['owner', 'partner'] as const) {
    assert.equal(partnerHome(partner('fake', role)), '/team/leads');
    assert.doesNotThrow(() => requireSalesPartner(partner('fake', role)));
  }
  assert.throws(() => requireSalesPartner(p), /Not found/);
  for (const action of ['prepare-call','active-lead','call-cell','call-outcome','call-offer','check','quote','deal','payout','import','invite','settings','deactivate','commission','connect-retry','connect-refresh','unknown-future-action'])
    assert.throws(() => requirePartnerAction(p, action), /Not found/);
  for (const action of ['password','password-prompt-dismiss','connect-onboard','connect-dashboard'])
    assert.doesNotThrow(() => requirePartnerAction(p, action));
  assert.throws(() => requirePartnerAction({...p, active:false}, 'connect-onboard'), /Not found/);
  assert.deepEqual(Object.values(AFFILIATE_STATUSES), ["Earned (awaiting Apple's payment)", 'Paid', 'Adjusted (monthly true-up)', 'Refunded']);
  assert.equal(affiliateLinks('messiah').length, 7);
  assert.equal(affiliateLinks('unrelated').length, 0);
});

test('affiliate real PostgreSQL isolation, balances, invite and own Connect onboarding', async t => {
  const dir = mkdtempSync(join(tmpdir(), 'wo0293-affiliate-pg-'));
  const net = createServer(); await new Promise<void>(r => net.listen(0, '127.0.0.1', r));
  const port = (net.address() as {port:number}).port; await new Promise<void>(r => net.close(() => r()));
  execFileSync('initdb', ['-D',dir,'-A','trust','--no-locale','-E','UTF8'], {stdio:'ignore'});
  execFileSync('pg_ctl', ['-D',dir,'-l',join(dir,'postgres.log'),'-o',`-F -p ${port} -h 127.0.0.1 -k ${dir}`,'-w','start'], {stdio:'ignore'});
  const db = new Pool({host:'127.0.0.1',port,database:'postgres'});
  try {
    await db.query('create table crm_payments(id uuid primary key)');
    for (const file of ['010_team_portal.sql','011_team_connect.sql','012_team_password.sql','020_appstore_affiliates.sql','023_affiliate_portal.sql'])
      await db.query(readFileSync('db/'+file,'utf8'));
    for (const [id, role] of [['fake-a','affiliate'],['fake-b','affiliate'],['fake-owner','owner']])
      await db.query('insert into team_partners(id,name,email,role) values($1,$2,$3,$4)', [id, 'Fictional '+id, id+'@example.test',role]);
    await db.query("update appstore_affiliates set partner_id='fake-a' where id='messiah'; insert into appstore_affiliates(id,display_name,partner_id) values('unrelated','Fictional B','fake-b')");
    const add = async (id:string, affiliate:string, cents:number, revoked=false) => {
      await db.query(`insert into appstore_transactions(transaction_id,original_id,app,environment,product_id,purchase_ms,affiliate_id,revoked)
        values($1,$2,'trendi','Production','monthly',1794484800000,$3,$4)`, [id,'private-original-'+id,affiliate,revoked]);
      await db.query('insert into appstore_commissions(transaction_id,affiliate_id,usd_cents,calculation,revoked) values($1,$2,$3,$4,$5)', [id,affiliate,cents,{},revoked]);
    };
    await add('private-a','messiah',1000); await add('private-b','unrelated',99000);
    const now = new Date('2026-11-12T12:00:00Z');
    await t.test('only signed-in affiliate data, no transaction identifiers or other partner values', async () => {
      const a = await affiliateSnapshot(db, partner('fake-a'),now), b = await affiliateSnapshot(db,partner('fake-b'),now);
      assert.equal(a.earned,1000); assert.equal(a.thisMonth,1000); assert.equal(a.owed,1000);
      assert.equal(b.earned,99000); assert.equal(a.sales.length,1); assert.equal(a.sales[0].status,'earned');
      assert.equal(b.links.length,0); assert.equal(a.links.length,7);
      assert.doesNotMatch(JSON.stringify(a), /private-|99000|fake-b|original_id|transaction_id|stripe_account_id|email/);
      await assert.rejects(affiliateSnapshot(db, partner('fake-owner','owner')), /Not found/);
      await assert.rejects(affiliateSnapshot(db, partner('fake-b','partner')), /Not found/);
      await db.query("update team_partners set active=false where id='fake-b'");
      await assert.rejects(affiliateSnapshot(db, partner('fake-b')), /not linked/);
      await db.query("update team_partners set active=true where id='fake-b'");
    });
    await t.test('paid, signed monthly adjustments and refunded owed-back stay affiliate-scoped', async () => {
      await db.query("insert into appstore_payouts(transaction_id,operation_key,destination,usd_cents,withheld_cents,status) values('private-a','fake-paid','acct_fake_a',1000,0,'done'),('private-b','fake-b-paid','acct_fake_b',99000,0,'done')");
      let a=await affiliateSnapshot(db,partner('fake-a'),now); assert.equal(a.sales[0].status,'paid'); assert.equal(a.owed,0);
      await db.query("insert into appstore_financial_reports(report_hash,fiscal_month,source,row_count) values('fake-report','2026-11','fictional',1)");
      await db.query("insert into appstore_adjustments(transaction_id,report_hash,fiscal_month,usd_cents,previous_cents,final_cents,calculation,basis,sources) values('private-a','fake-report','2026-11',-100,1000,900,'{}','trued_up_financial_report','[]')");
      a=await affiliateSnapshot(db,partner('fake-a'),now); assert.equal(a.earned,900); assert.equal(a.owedBack,100);
      assert.equal(a.sales[0].status,'adjusted'); assert.equal(a.sales[0].amount,-100);
      await db.query("update appstore_transactions set revoked=true where transaction_id='private-a'; update appstore_commissions set revoked=true where transaction_id='private-a'");
      a=await affiliateSnapshot(db,partner('fake-a'),now); assert.equal(a.earned,0); assert.equal(a.owedBack,1000);
      assert.ok(a.sales.some(s=>s.status==='refunded'&&s.amount<0));
      await db.query("insert into appstore_reversals(transaction_id,payout_key,operation_key,transfer_id,usd_cents,status) values('private-b','fake-b-paid','fake-b-reversal','tr_fake_b',99000,'done')");
      assert.equal((await affiliateSnapshot(db,partner('fake-a'),now)).owedBack,1000);
    });
    await t.test('owner invite links the affiliate atomically; partner cannot create an affiliate', async () => {
      await db.query("insert into appstore_affiliates(id,display_name) values('new-fixture','Fictional new affiliate')");
      await assert.rejects(invite(db,partner('fake-a'),{role:'affiliate'}),/Only Blake/);
      const q=await db.connect();
      try {
        await q.query('begin');
        const result=await invite(q,partner('fake-owner','owner'),{role:'affiliate',affiliate_id:'new-fixture',name:'Fictional new affiliate',email:'fixture-new@example.test'});
        const row=(await q.query('select p.role,a.rate_bps from team_partners p join appstore_affiliates a on a.partner_id=p.id where p.id=$1',[result.id])).rows[0];
        assert.equal(row.role,'affiliate');assert.equal(row.rate_bps,2500);
        await assert.rejects(invite(q,partner('fake-owner','owner'),{role:'affiliate',affiliate_id:'new-fixture',name:'Again',email:'again@example.test'}),/needs owner review/);
      } finally { await q.query('rollback');q.release(); }
    });
    await t.test('Connect button service creates only own Express link and affiliate return URLs', async () => {
      let creates=0,links=0;
      const client={accounts:{create:async (body:{type:string;metadata:{partner_id:string}})=>{
        assert.equal(body.type,'express');assert.equal(body.metadata.partner_id,'fake-a');creates++;
        return {id:'acct_fake_a',charges_enabled:false,payouts_enabled:false,details_submitted:false};
      }},accountLinks:{create:async (body:{account:string;refresh_url:string;return_url:string})=>{
        assert.equal(body.account,'acct_fake_a'); assert.equal(body.refresh_url,'https://example.test/team/affiliate?connect=refresh');assert.equal(body.return_url,'https://example.test/team/affiliate?connect=return');links++;
        return {url:'https://connect.stripe.com/setup/fixture'};
      }}} as unknown as Stripe;
      assert.equal((await onboard(db,partner('fake-a'),'https://example.test',client)).url,'https://connect.stripe.com/setup/fixture');
      await onboard(db,partner('fake-a'),'https://example.test',client);
      assert.equal(creates,1);assert.equal(links,2);
      assert.equal((await db.query('select count(*)::int n from team_connect_accounts')).rows[0].n,1);
    });
    await t.test('existing email flow passes affiliate role, returns acceptance ID, and suppresses a duplicate', async () => {
      let sends=0;
      const send=async (email:string,url:string,role?:string)=>{assert.equal(email,'fake-a@example.test');assert.match(url,/^https:\/\/example.test\/team\?token=/);assert.equal(role,'affiliate');sends++;return {messageId:'fictional-provider-id'};};
      const result=await requestMagicLink(db,'fake-a@example.test','https://example.test',send);
      assert.equal(result?.messageId,'fictional-provider-id');
      await requestMagicLink(db,'fake-a@example.test','https://example.test',send); assert.equal(sends,1);
    });
  } finally { await db.end();execFileSync('pg_ctl',['-D',dir,'-m','fast','-w','stop'],{stdio:'ignore'}); }
});
