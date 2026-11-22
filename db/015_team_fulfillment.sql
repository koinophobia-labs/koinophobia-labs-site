-- WO-0274: additive and idempotent; payment and commission rows are unchanged.
create table if not exists team_jobs (
 id text primary key,
 payment_id uuid not null references crm_payments(id),
 proposal_id uuid not null unique references crm_proposals(id),
 deal_id text unique references team_deals(id),
 partner_id text references team_partners(id),
 business text not null, website text not null default '', offer text not null,
 stage text not null default 'New' check(stage in ('New','Waiting on client access','In progress','Fix ready','Verified','Delivered','Closed')),
 paid_at timestamptz not null, deadline timestamptz,
 access_since timestamptz not null default now(),
 code text not null unique, code_expires_at timestamptz not null,
 data jsonb not null default '{}',
 verification jsonb not null default '[]', verification_due_at timestamptz,
 verification_lease timestamptz, revision integer not null default 0,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists team_jobs_open on team_jobs(deadline) where stage not in ('Delivered','Closed');
create table if not exists team_job_events (
 id bigserial primary key, job_id text not null references team_jobs(id),
 kind text not null, detail text not null default '', created_at timestamptz not null default now()
);
create table if not exists team_job_messages (
 id text primary key, job_id text not null references team_jobs(id),
 kind text not null check(kind in ('next','fixed','due-soon','overdue','access')),
 status text not null default 'pending' check(status in ('pending','sending','sent','failed','uncertain')),
 attempted_at timestamptz, sent_at timestamptz, error text,
 created_at timestamptz not null default now()
);
