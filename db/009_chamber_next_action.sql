-- WO-0118: apply through the reviewed migration workflow, never during build.
alter table crm_leads add column if not exists next_action text not null default '';
create index if not exists crm_leads_source_idx on crm_leads (lower(source));
