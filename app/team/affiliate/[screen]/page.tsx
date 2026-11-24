import { notFound } from 'next/navigation';
import { AFFILIATE_SCREENS, type AffiliateScreen } from '@/components/team/AffiliatePortal';
import { renderAffiliate } from '../load';
import '../affiliate.css';

export default async function AffiliateScreenPage({ params, searchParams }: {
  params: Promise<{ screen: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { screen } = await params;
  if (screen === 'overview' || !AFFILIATE_SCREENS.includes(screen as AffiliateScreen)) notFound();
  return renderAffiliate(screen as AffiliateScreen, await searchParams);
}
