-- Additive only. No CRM table alterations. All money remains in crm_payments.
create table if not exists team_partners (
 id text primary key, name text not null, email text not null unique,
 role text not null check(role in ('owner','partner')), active boolean not null default true,
 parent_partner_id text references team_partners(id), override_rate numeric not null default 0 check(override_rate between 0 and 1),
 password_hash text, invite_hash text unique, invite_expires_at timestamptz,
 created_at timestamptz not null default now()
);
create table if not exists team_sessions (
 token_hash text primary key, partner_id text not null references team_partners(id), expires_at timestamptz not null
);
create table if not exists team_login_tokens (
 token_hash text primary key, partner_id text not null references team_partners(id), expires_at timestamptz not null
);
create table if not exists team_rate_limits (
 key text primary key, attempts integer not null, reset_at timestamptz not null
);
create table if not exists team_leads (
 id text primary key, partner_id text not null references team_partners(id),
 business text not null, email text not null default '', phone text not null default '', website text not null,
 data jsonb not null, created_at timestamptz not null default now(), unique(id,partner_id)
);
create index if not exists team_leads_partner on team_leads(partner_id);
create table if not exists team_deals (
 id text primary key, partner_id text not null references team_partners(id), lead_id text not null,
 services jsonb not null, price integer check(price >= 0), monthly integer not null default 0 check(monthly >= 0),
 approved boolean not null default false, scope text not null, stage text not null default 'Lead'
 check(stage in ('Lead','Contacted','Site check sent','Quote sent','Won','Client paid','Delivered','Lost')),
 lost_reason text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 foreign key(lead_id,partner_id) references team_leads(id,partner_id), unique(id,partner_id)
);
create index if not exists team_deals_partner on team_deals(partner_id);
create table if not exists team_payment_attributions (
 payment_id uuid primary key references crm_payments(id), deal_id text not null references team_deals(id),
 created_at timestamptz not null default now()
);
create table if not exists team_payouts (
 id text primary key, partner_id text not null, deal_id text not null, amount integer not null check(amount > 0),
 recorded_by text not null references team_partners(id), paid_at timestamptz not null default now(),
 foreign key(deal_id,partner_id) references team_deals(id,partner_id)
);
create table if not exists team_opt_outs (
 key text primary key, recorded_by text not null references team_partners(id), created_at timestamptz not null default now()
);
create table if not exists team_site_checks (
 id text primary key, partner_id text not null references team_partners(id), data jsonb not null, created_at timestamptz not null default now()
);
create table if not exists team_settings (key text primary key, value text not null);
