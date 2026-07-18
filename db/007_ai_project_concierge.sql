alter table crm_leads add column if not exists concierge_data jsonb not null default '{}';
create index if not exists crm_leads_concierge_source_idx on crm_leads(source, created_at desc);
create index if not exists crm_leads_concierge_review_idx on crm_leads(((concierge_data->>'requiresHumanReview')::boolean))
where concierge_data ? 'requiresHumanReview';
create unique index if not exists crm_leads_concierge_session_idx on crm_leads((concierge_data->>'sessionId'))
where source = 'ai_project_concierge' and concierge_data ? 'sessionId';
