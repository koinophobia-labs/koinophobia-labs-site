-- WO-0292. Additive, no login, invite, Connect account or existing tier change.
create table if not exists appstore_affiliates (
 id text primary key, display_name text not null,
 partner_id text unique references team_partners(id),
 commission_basis text not null default 'apple_proceeds' check(commission_basis='apple_proceeds'),
 rate_bps integer not null default 2500 check(rate_bps=2500)
);
insert into appstore_affiliates(id,display_name) values('messiah','Messiah') on conflict do nothing;
create table if not exists appstore_notifications (
 uuid text primary key, app text not null, environment text not null check(environment in ('Production','Sandbox')),
 kind text not null, payload_sha256 text not null, transaction_id text,
 received_at timestamptz not null default now(), verified_at timestamptz not null default now()
);
create table if not exists appstore_transactions (
 transaction_id text primary key, original_id text not null, app text not null,
 environment text not null check(environment in ('Production','Sandbox')), product_id text not null,
 purchase_ms bigint not null, price_milliunits bigint, currency text,
 affiliate_id text references appstore_affiliates(id), offer_identifier text, attribution_transaction_id text,
 revoked boolean not null default false, reason text,
 verified_at timestamptz not null default now()
);
create table if not exists appstore_commissions (
 transaction_id text primary key references appstore_transactions(transaction_id),
 affiliate_id text not null references appstore_affiliates(id),
 usd_cents integer not null check(usd_cents>=0), calculation jsonb not null,
 revoked boolean not null default false, created_at timestamptz not null default now()
);
create table if not exists appstore_payouts (
 transaction_id text primary key references appstore_commissions(transaction_id),
 operation_key text not null unique, destination text,
 usd_cents integer not null check(usd_cents>=0), withheld_cents integer not null check(withheld_cents>=0),
 status text not null check(status in ('pending','done','review','cancelled')),
 stripe_id text unique, started_at timestamptz not null default now(), completed_at timestamptz,
 error_code text,
 check(usd_cents=0 or destination is not null)
);
create table if not exists appstore_reversals (
 transaction_id text primary key references appstore_payouts(transaction_id),
 operation_key text not null unique, transfer_id text not null,
 usd_cents integer not null check(usd_cents>0),
 status text not null check(status in ('pending','done','owed_back','review')),
 stripe_id text unique, started_at timestamptz not null default now(), completed_at timestamptz,
 error_code text
);
create index if not exists appstore_transactions_original on appstore_transactions(app,environment,original_id);
create index if not exists appstore_commissions_affiliate on appstore_commissions(affiliate_id);

-- Trusted reconciliation input, never written from a notification or customer.
-- Only transaction-matched net proceeds may release a held commission.
create table if not exists appstore_verified_proceeds (
 transaction_id text primary key references appstore_transactions(transaction_id),
 basis jsonb not null, verified_at timestamptz not null default now()
);
