create table if not exists crm_proposals (
  id uuid primary key,
  lead_id uuid not null references crm_leads(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft','ready','sent','accepted','declined','expired')),
  version integer not null check (version > 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), sent_at timestamptz,
  valid_until date, title text not null, executive_summary text not null, client_problems jsonb not null default '[]',
  recommended_solution text not null, scope_items jsonb not null default '[]', deliverables jsonb not null default '[]',
  exclusions jsonb not null default '[]', timeline text not null, milestones jsonb not null default '[]',
  pricing_model text not null default 'fixed' check (pricing_model in ('fixed','hourly','retainer')),
  line_items jsonb not null default '[]', subtotal integer not null default 0 check (subtotal >= 0),
  discount integer not null default 0 check (discount >= 0), total integer not null default 0 check (total >= 0),
  payment_terms text not null, assumptions jsonb not null default '[]', revision_policy text not null,
  next_steps text not null, internal_notes text not null default '',
  unique (lead_id, version)
);
create index if not exists crm_proposals_lead_idx on crm_proposals(lead_id, version desc);
