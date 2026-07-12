create table if not exists crm_proposal_audit_findings (
  proposal_id uuid not null references crm_proposals(id) on delete cascade,
  audit_id uuid not null references crm_audits(id) on delete cascade,
  finding_id uuid not null references crm_audit_findings(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key(proposal_id,finding_id)
);
create index if not exists crm_proposal_audit_findings_audit_idx on crm_proposal_audit_findings(audit_id,proposal_id);
