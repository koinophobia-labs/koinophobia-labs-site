alter table crm_audits drop constraint if exists crm_audits_status_check;
alter table crm_audits alter column status set default 'queued';
update crm_audits set status='completed' where status in ('draft','ready');
alter table crm_audits add constraint crm_audits_status_check check (status in ('queued','running','completed','failed','cancelled'));
alter table crm_audits add column if not exists normalized_domain text;
alter table crm_audits add column if not exists failed_at timestamptz;
alter table crm_audits add column if not exists cancelled_at timestamptz;
alter table crm_audits add column if not exists archived_at timestamptz;
alter table crm_audits add column if not exists failure_code text;
alter table crm_audits add column if not exists failure_message text;
alter table crm_audits add column if not exists retry_count integer not null default 0;
alter table crm_audits add column if not exists retried_from_audit_id uuid references crm_audits(id);
alter table crm_audits add column if not exists pages_requested integer not null default 1 check (pages_requested between 1 and 10);
alter table crm_audits add column if not exists pages_scanned integer not null default 0;
alter table crm_audits add column if not exists progress_current integer not null default 0;
alter table crm_audits add column if not exists progress_total integer not null default 1;
alter table crm_audits add column if not exists progress_message text not null default 'Queued';
alter table crm_audits add column if not exists report_version integer not null default 2;
alter table crm_audits add column if not exists scores jsonb not null default '{}';
alter table crm_audits add column if not exists scoring_inputs jsonb not null default '{}';
alter table crm_audits add column if not exists scoring_version text not null default 'audit-score-v1';

alter table crm_audits drop constraint if exists crm_audits_retry_count_check;
alter table crm_audits add constraint crm_audits_retry_count_check check (retry_count >= 0);
alter table crm_audits drop constraint if exists crm_audits_progress_check;
alter table crm_audits add constraint crm_audits_progress_check check (
  progress_current >= 0 and progress_total >= 0 and progress_current <= progress_total and pages_scanned >= 0
);
create index if not exists crm_audits_history_idx on crm_audits(lead_id, archived_at, created_at desc);
create index if not exists crm_audits_retry_idx on crm_audits(retried_from_audit_id) where retried_from_audit_id is not null;

create table if not exists crm_audit_measurements (
 id uuid primary key, audit_id uuid not null references crm_audits(id) on delete cascade,
 page_url text not null, category text not null, metric_key text not null,
 value jsonb not null, available boolean not null default true, captured_at timestamptz not null default now()
);
create unique index if not exists crm_audit_measurements_unique_idx on crm_audit_measurements(audit_id,page_url,category,metric_key);
create index if not exists crm_audit_measurements_audit_idx on crm_audit_measurements(audit_id);

create or replace function reject_audit_measurement_mutation() returns trigger language plpgsql as $$
begin raise exception 'AUDIT_MEASUREMENT_IMMUTABLE' using errcode = '55000'; end $$;
drop trigger if exists crm_audit_measurements_immutable on crm_audit_measurements;
create trigger crm_audit_measurements_immutable before update or delete on crm_audit_measurements
for each row execute function reject_audit_measurement_mutation();

create table if not exists crm_audit_findings (
 id uuid primary key, audit_id uuid not null references crm_audits(id) on delete cascade,
 category text not null check(category in ('security','seo','mobile','accessibility','performance','broken_links','conversion','contact_visibility','content_clarity')),
 severity text not null check(severity in ('critical','high','medium','low','informational','positive')),
 title text not null, description text not null, evidence text not null, impact text not null,
 recommendation text not null, page_url text, provenance text not null check(provenance in ('measured','heuristic','founder')),
 client_visible boolean not null default true, selected_for_proposal boolean not null default false,
 sort_order integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists crm_audit_findings_audit_idx on crm_audit_findings(audit_id,sort_order);
create index if not exists crm_audit_findings_filter_idx on crm_audit_findings(audit_id,severity,client_visible,selected_for_proposal);

create table if not exists crm_audit_rate_limits (
 bucket_key text primary key, window_started_at timestamptz not null, attempts integer not null
);
alter table crm_audit_rate_limits drop constraint if exists crm_audit_rate_limits_attempts_check;
alter table crm_audit_rate_limits add constraint crm_audit_rate_limits_attempts_check check(attempts >= 1);
create index if not exists crm_audit_rate_limits_window_idx on crm_audit_rate_limits(window_started_at);

update crm_audits set normalized_domain=lower(split_part(regexp_replace(target_url,'^https?://','','i'),'/',1)) where normalized_domain is null;
update crm_audits set pages_scanned=pages_checked, progress_current=pages_checked, progress_total=greatest(pages_checked,1), progress_message='Imported legacy audit' where pages_scanned=0;
update crm_audits set completed_at=coalesce(completed_at,updated_at) where status='completed';
update crm_audits set failed_at=coalesce(failed_at,completed_at,updated_at), failure_code=coalesce(failure_code,'LEGACY_FAILURE'), failure_message=coalesce(failure_message,error_message,'Audit failed') where status='failed';
update crm_audits set progress_current=progress_total, progress_message='Completed' where status='completed';
