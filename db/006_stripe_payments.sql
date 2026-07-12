alter table crm_leads add column if not exists payment_status text not null default 'not_started';
alter table crm_leads drop constraint if exists crm_leads_payment_status_check;
alter table crm_leads add constraint crm_leads_payment_status_check check(payment_status in ('not_started','deposit_pending','deposit_paid','balance_pending','paid','failed','refunded'));

alter table crm_proposals add column if not exists payment_status text not null default 'not_started';
alter table crm_proposals add column if not exists amount_paid integer not null default 0;
alter table crm_proposals drop constraint if exists crm_proposals_amount_paid_check;
alter table crm_proposals add constraint crm_proposals_amount_paid_check check(amount_paid >= 0 and amount_paid <= total);

create table if not exists crm_payments (
 id uuid primary key, proposal_id uuid not null references crm_proposals(id) on delete restrict,
 lead_id uuid not null references crm_leads(id) on delete restrict,
 kind text not null check(kind in ('deposit','balance')),
 status text not null default 'pending' check(status in ('pending','paid','failed','expired','refunded')),
 amount integer not null check(amount > 0), currency text not null default 'usd',
 stripe_checkout_session_id text unique, stripe_payment_intent_id text,
 checkout_url text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 paid_at timestamptz, failed_at timestamptz, expired_at timestamptz, refunded_at timestamptz
);
create index if not exists crm_payments_proposal_idx on crm_payments(proposal_id,created_at desc);
create index if not exists crm_payments_lead_idx on crm_payments(lead_id,created_at desc);

create table if not exists stripe_webhook_events (
 event_id text primary key, event_type text not null, received_at timestamptz not null default now(), processed_at timestamptz, processing_error text
);
