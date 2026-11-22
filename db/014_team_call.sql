-- WO-0270: additive, idempotent. No existing rows or tables removed.
create table if not exists team_active_leads (
 partner_id text primary key references team_partners(id),
 lead_id text not null references team_leads(id), updated_at timestamptz not null default now()
);
create table if not exists team_call_details (
 lead_id text primary key references team_leads(id), cell text not null default '',
 outcome text, follow_up_at timestamptz, updated_at timestamptz not null default now()
);
create table if not exists team_call_events (
 id text primary key, lead_id text not null references team_leads(id),
 actor_id text not null references team_partners(id), outcome text not null,
 created_at timestamptz not null default now()
);
create table if not exists team_deal_pages (
 code text primary key check(code ~ '^[23456789abcdefghjkmnpqrstuvwxyz]{10}$'),
 deal_id text not null unique references team_deals(id),
 is_demo boolean not null default false, proof_reviewed_by text references team_partners(id),
 problem text not null, proof_image text not null, proof_at timestamptz not null,
 expires_at timestamptz not null default now()+interval '7 days',
 opened_at timestamptz, checkout_started_at timestamptz, paid_at timestamptz,
 follow_up_created_at timestamptz, created_at timestamptz not null default now()
);
create index if not exists team_deal_pages_followup on team_deal_pages(opened_at) where paid_at is null;
create table if not exists team_owner_alerts (
 deal_id text primary key references team_deals(id),
 message text not null default 'New client — start the work', created_at timestamptz not null default now()
);
create table if not exists team_payment_followups (
 deal_id text primary key references team_deals(id), lead_id text not null references team_leads(id),
 due_at timestamptz not null, resolved_at timestamptz,
 created_at timestamptz not null default now()
);
