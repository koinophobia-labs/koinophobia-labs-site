-- WO-0292: additive receipt gate. No account, permission or Stripe setting changes.
create table if not exists appstore_monthly_runs (
 fiscal_month text primary key check(fiscal_month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
 received_by text not null references team_partners(id), received_at timestamptz not null default now(),
 report_hash text references appstore_financial_reports(report_hash),
 status text not null default 'received' check(status in ('received','pending','paid','review')),
 operation_key text not null unique, attempt_number integer not null default 0, destination text, stripe_id text unique,
 usd_cents bigint not null default 0 check(usd_cents>=0),
 withheld_cents bigint not null default 0 check(withheld_cents>=0),
 started_at timestamptz, completed_at timestamptz, error_code text,
 check(usd_cents=0 or destination is not null)
);
create table if not exists appstore_monthly_attempts (
 operation_key text primary key, fiscal_month text not null references appstore_monthly_runs(fiscal_month),
 snapshot jsonb not null, disposition text not null default 'prepared', created_at timestamptz not null default now()
);
create table if not exists appstore_monthly_authorizations (
 fiscal_month text not null references appstore_monthly_runs(fiscal_month),
 report_hash text not null references appstore_financial_reports(report_hash),
 transaction_id text not null references appstore_commissions(transaction_id),
 authorized_cents bigint not null check(authorized_cents>=0),
 confirmed_by text not null references team_partners(id), confirmed_at timestamptz not null default now(),
 primary key(fiscal_month,report_hash,transaction_id)
);
create table if not exists appstore_monthly_allocations (
 fiscal_month text not null references appstore_monthly_runs(fiscal_month),
 operation_key text not null references appstore_monthly_attempts(operation_key),
 transaction_id text not null references appstore_commissions(transaction_id),
 source_month text not null, report_hash text not null references appstore_financial_reports(report_hash),
 final_cents bigint not null check(final_cents>=0),
 usd_cents bigint not null check(usd_cents>=0), withheld_cents bigint not null check(withheld_cents>=0),
 primary key(operation_key,transaction_id)
);
