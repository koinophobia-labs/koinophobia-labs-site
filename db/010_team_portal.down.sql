-- Use only on an empty portal or after explicit owner-authorized archival.
-- Ordinary rollback is code-only: keep all portal data and CRM payments.
drop table if exists team_settings;
drop table if exists team_site_checks;
drop table if exists team_opt_outs;
drop table if exists team_payouts;
drop table if exists team_payment_attributions;
drop table if exists team_deals;
drop table if exists team_leads;
drop table if exists team_rate_limits;
drop table if exists team_login_tokens;
drop table if exists team_sessions;
drop table if exists team_partners;
