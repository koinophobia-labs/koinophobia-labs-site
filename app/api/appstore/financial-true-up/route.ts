import {timingSafeEqual} from 'node:crypto';
import {monthlyTrueUp} from '@/lib/appstore/financial-reports';
import {teamDatabase} from '@/lib/team/db';
export const runtime='nodejs';
export const maxDuration=300;
export async function GET(request:Request){
  const secret=process.env.CRON_SECRET,a=Buffer.from(request.headers.get('authorization')||''),b=Buffer.from('Bearer '+secret);
  if(!secret||a.length!==b.length||!timingSafeEqual(a,b))return new Response(null,{status:401});
  if(process.env.VERCEL_ENV!=='production'||process.env.APPSTORE_NOTIFICATIONS_ENABLED!=='true')return new Response(null,{status:503});
  try{return Response.json({ok:true,reports:await monthlyTrueUp(teamDatabase())});}
  catch{return Response.json({error:'Financial true-up pending: check Finance key access, vendor number and report matching in owner view'},{status:503});}
}
