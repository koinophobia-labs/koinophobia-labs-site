import { timingSafeEqual } from 'node:crypto';
import { reconcile } from '@/lib/appstore/service';
import { teamDatabase } from '@/lib/team/db';
export const runtime='nodejs';
export const maxDuration=300;
export async function GET(request:Request) {
  const expected=process.env.CRON_SECRET;
  const supplied=Buffer.from(request.headers.get('authorization')||'');
  const valid=Buffer.from('Bearer '+expected);
  if (!expected || supplied.length!==valid.length || !timingSafeEqual(supplied,valid)) return new Response(null,{status:401});
  if (process.env.VERCEL_ENV!=='production' || process.env.APPSTORE_NOTIFICATIONS_ENABLED!=='true') return new Response(null,{status:503});
  try { await reconcile(teamDatabase()); return Response.json({ok:true}); }
  catch { return Response.json({error:'Reconciliation requires retry or owner review'},{status:503}); }
}
