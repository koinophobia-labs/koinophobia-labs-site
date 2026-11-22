-- WO-0294: additive configuration and immutable attribution. No accrual rewrite.
create table if not exists appstore_earning_rules (
  id text primary key,
  partner text not null references appstore_affiliates(id),
  earning_type text not null check (earning_type in ('affiliate_commission','revenue_share')),
  app_ids bigint[],
  attribution_type text not null check (attribution_type in ('verified_code','all_sales')),
  partner_bps integer not null check (partner_bps between 0 and 10000),
  cost_deduction numeric(24,12) not null default 0 check (cost_deduction >= 0),
  active boolean not null default true,
  check ((earning_type='revenue_share' and attribution_type='all_sales' and cardinality(app_ids)>0)
    or (earning_type='affiliate_commission' and attribution_type='verified_code'))
);
insert into appstore_earning_rules(id,partner,earning_type,app_ids,attribution_type,partner_bps)
values ('messiah-code','messiah','affiliate_commission',null,'verified_code',2500),
 ('messiah-saiikhotic','messiah','revenue_share',array[6831629900,6832131528]::bigint[],'all_sales',6000)
on conflict do nothing;

alter table appstore_transactions add column if not exists earning_rule jsonb;

-- One earning rule per app/subscription lineage; renewals remain distinct charges.
create table if not exists appstore_earning_attributions (
  app_id bigint not null, environment text not null, original_id text not null,
  rule jsonb not null, created_at timestamptz not null default now(),
  primary key(app_id,environment,original_id)
);

-- Fractional cents are retained in calculation JSON. This separate, additive
-- adjustment rounds only new WO-0294 earnings at fiscal-month level. Paid allocation snapshots
-- remain immutable; financial corrections update entitlements, never cash history.
create table if not exists appstore_monthly_rounding (
  transaction_id text primary key references appstore_commissions(transaction_id),
  fiscal_month text not null, report_hash text not null,
  delta_cents integer not null, exact_usd text not null, updated_at timestamptz not null default now()
);

-- A settled allocation stays immutable. A later financial correction only uses
-- its rounding residue when the exact entitlement still matches that snapshot.
create or replace view appstore_effective_rounding as
select r.transaction_id,case when coalesce(a.calculation,c.calculation)->>'exactUsd'=r.exact_usd
  then r.delta_cents else 0 end as delta_cents
from appstore_monthly_rounding r join appstore_commissions c using(transaction_id)
left join lateral(select calculation from appstore_adjustments where transaction_id=c.transaction_id order by id desc limit 1) a on true;
