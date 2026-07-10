create table if not exists crm_leads (
  id uuid primary key, dedupe_key text not null unique,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  source text not null, name text not null, business_name text not null, email text not null, phone text not null default '',
  website_or_social text not null, industry text not null, service_interest text not null, budget_range text not null default '',
  timeline text not null, biggest_problem text not null, notes text not null default '',
  status text not null default 'new' check (status in ('new','contacted','replied','meeting','proposal','won','lost')),
  last_contacted_at timestamptz, follow_up_at timestamptz, audit_completed boolean not null default false,
  proposal_sent_at timestamptz, outcome text not null default 'open' check (outcome in ('open','won','lost')),
  internal_notes text not null default ''
);
create index if not exists crm_leads_status_idx on crm_leads(status);
create index if not exists crm_leads_follow_up_idx on crm_leads(follow_up_at) where follow_up_at is not null;
