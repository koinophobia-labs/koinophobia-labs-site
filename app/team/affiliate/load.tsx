import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { currentPartner } from '@/lib/team/session';
import { hostedPreview, teamDatabase } from '@/lib/team/db';
import { affiliateSnapshot } from '@/lib/team/affiliate-store';
import { AffiliatePortal, type AffiliateScreen } from '@/components/team/AffiliatePortal';
import { AccountPassword } from '@/components/team/AccountPassword';
import { cookieName, passwordState } from '@/lib/team/auth';
import type { AffiliateFilter } from '@/lib/team/affiliate-view';

const one = (v: string | string[] | undefined) => (typeof v === 'string' && v.length <= 120 ? v : undefined);

export async function renderAffiliate(screen: AffiliateScreen, query: Record<string, string | string[] | undefined> = {}) {
  const partner = await currentPartner();
  if (!partner) redirect('/team');
  if (partner.role !== 'affiliate' || hostedPreview()) notFound();
  const [data, state] = await Promise.all([
    affiliateSnapshot(teamDatabase(), partner),
    passwordState(teamDatabase(), (await cookies()).get(cookieName)!.value),
  ]);
  const filter: AffiliateFilter = { app: one(query.app), type: one(query.type), status: one(query.status) };
  return <AffiliatePortal screen={screen} data={data} filter={filter} accountOpen={!state.hasPassword}
    account={<AccountPassword state={state} readonly={false} home="/team/affiliate" />} />;
}
