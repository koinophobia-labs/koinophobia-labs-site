-- Additive. Bank, card, tax identity and onboarding/login URLs stay at Stripe.
create table if not exists team_connect_accounts (
 partner_id text primary key references team_partners(id),
 stripe_account_id text not null unique,
 charges_enabled boolean not null default false,
 payouts_enabled boolean not null default false,
 details_submitted boolean not null default false
);
create table if not exists team_connect_payments (
 payment_id uuid primary key references crm_payments(id),
 partner_id text not null references team_partners(id), deal_id text not null references team_deals(id),
 amount integer not null check(amount>0), currency text not null check(currency='usd'),
 source_type text not null check(source_type in ('checkout','invoice')), source_id text not null unique,
 charge_id text unique, transfer_id text unique,
 transferred integer not null default 0 check(transferred>=0),
 reversed integer not null default 0 check(reversed>=0 and reversed<=transferred),
 offset_in integer not null default 0 check(offset_in>=0), offset_out integer not null default 0 check(offset_out>=0),
 loss integer not null default 0 check(loss>=0 and loss<=amount),
 settled boolean not null default false, error text,
 created_at timestamptz not null default now()
);
create table if not exists team_connect_operations (
 id text primary key, payment_id uuid not null references team_connect_payments(payment_id),
 kind text not null check(kind in ('transfer','reversal')),
 parameters jsonb not null, offsets jsonb not null default '[]',
 status text not null default 'pending' check(status in ('pending','done','insufficient','review')),
 stripe_id text, created_at timestamptz not null default now()
);
-- Retain the greatest cumulative exposure per charge: delivery order and overlap
-- cannot double-reverse a payment. A won dispute is deliberately owner-reconciled.
create table if not exists team_connect_losses (
 charge_id text primary key, refunded integer not null default 0 check(refunded>=0),
 disputed integer not null default 0 check(disputed>=0)
);
