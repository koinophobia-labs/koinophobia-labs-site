import type { Queryable } from '../payments';
import type { Partner } from './types';
import { Fault } from './domain';
import { validTimeZone } from './call-schedule';
export async function savePartnerTimeZone(q:Queryable, partner:Partner, value:unknown) {
  if(value!==''&&!validTimeZone(value))throw new Fault('Choose a valid time zone.');
  await q.query('insert into team_settings(key,value) values($1,$2) on conflict(key) do update set value=excluded.value',['partner-time-zone:'+partner.id,value]);
  return {ok:true};
}
