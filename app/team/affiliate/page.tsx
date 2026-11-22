import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { currentPartner } from '@/lib/team/session';
import { hostedPreview, teamDatabase } from '@/lib/team/db';
import { affiliateSnapshot } from '@/lib/team/affiliate-store';
import { AffiliateDashboard } from '@/components/team/AffiliateDashboard';
import { AccountPassword } from '@/components/team/AccountPassword';
import { cookieName, passwordState } from '@/lib/team/auth';
import './affiliate.css';

export default async function AffiliatePage() {
  const partner = await currentPartner();
  if (!partner) redirect('/team');
  if (partner.role !== 'affiliate' || hostedPreview()) notFound();
  const [data, state] = await Promise.all([
    affiliateSnapshot(teamDatabase(), partner),
    passwordState(teamDatabase(), (await cookies()).get(cookieName)!.value),
  ]);
  return <AffiliateDashboard data={data} account={<AccountPassword state={state} readonly={false} home="/team/affiliate" />} />;
}
