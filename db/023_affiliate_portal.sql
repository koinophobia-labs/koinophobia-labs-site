-- WO-0293. Expand the role constraint; no existing rows, earnings or payouts change.
alter table team_partners drop constraint team_partners_role_check;
alter table team_partners add constraint team_partners_role_check check(role in ('owner','partner','affiliate'));
-- Account creation and linkage happen explicitly after production verification.
-- Do not create Messiah, send email, or touch any Stripe account in a migration.
