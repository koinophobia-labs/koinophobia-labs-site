create table if not exists crm_audits (
  id uuid primary key,
  lead_id uuid not null references crm_leads(id) on delete cascade,
  status text not null default 'running' check (status in ('running','draft','ready','failed')),
  target_url text not null, final_url text, started_at timestamptz not null default now(), completed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  summary text not null default '', findings jsonb not null default '[]', metrics jsonb not null default '{}',
  pages_checked integer not null default 0, links_checked integer not null default 0,
  internal_notes text not null default '', error_message text
);
create index if not exists crm_audits_lead_idx on crm_audits(lead_id, created_at desc);
