import { readFileSync } from 'node:fs';
import pg from 'pg';
import { resolveMigrationPlan,verifyDatabaseIdentity } from './database-migrations.mjs';
const plan=resolveMigrationPlan();
const client=new pg.Client({connectionString:plan.databaseUrl});
try {
  await client.connect(); await verifyDatabaseIdentity(client,plan);
  await client.query('begin');
  await client.query("select pg_advisory_xact_lock(hashtext('team-migration'))");
  await client.query(readFileSync(new URL('../db/020_appstore_affiliates.sql',import.meta.url),'utf8'));
  await client.query(readFileSync(new URL('../db/021_appstore_monthly.sql',import.meta.url),'utf8'));
  await client.query(readFileSync(new URL('../db/024_appstore_earning_rules.sql',import.meta.url),'utf8'));
  await client.query('commit'); console.log('Additive App Store affiliate migration committed.');
} catch {
  await client.query('rollback').catch(()=>{});
  console.error('App Store migration refused or failed; credentials omitted.');process.exitCode=1;
} finally {await client.end();}
