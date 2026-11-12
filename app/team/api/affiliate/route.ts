import { currentPartner } from '@/lib/team/session';
import { hostedPreview, teamDatabase } from '@/lib/team/db';
import { affiliateSnapshot } from '@/lib/team/affiliate-store';
import { Fault } from '@/lib/team/domain';
export const runtime = 'nodejs';
export async function GET() {
  const headers = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' };
  try {
    const partner = await currentPartner();
    if (!partner) throw new Fault('Please sign in.', 401);
    if (hostedPreview()) throw new Fault('Not found.', 404);
    return Response.json(await affiliateSnapshot(teamDatabase(), partner), { headers });
  } catch (e) {
    return Response.json({ error: e instanceof Fault ? e.message : 'Affiliate earnings are unavailable. Try again later.' }, { status: e instanceof Fault ? e.status : 500, headers });
  }
}
