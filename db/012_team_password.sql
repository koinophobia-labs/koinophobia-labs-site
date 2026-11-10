-- WO-0264: additive; existing credentials and sessions are preserved.
alter table team_partners add column if not exists password_prompt_dismissed boolean not null default false;
alter table team_sessions add column if not exists password_reset_until timestamptz;
