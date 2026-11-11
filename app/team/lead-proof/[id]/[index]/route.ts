import {currentPartner} from '@/lib/team/session';
import {teamDatabase,hostedPreview} from '@/lib/team/db';
import {confirmedLeverage} from '@/lib/team/leverage';
export const runtime='nodejs';
export async function GET(_request:Request,{params}:{params:Promise<{id:string;index:string}>}){
  const p=await currentPartner();if(!p||hostedPreview())return new Response(null,{status:401});
  const {id,index}=await params;const i=Number(index);
  if(!Number.isInteger(i)||i<0||i>30)return new Response(null,{status:404});
  const row=(await teamDatabase().query('select data from team_leads where id=$1 and ($2::text is null or partner_id=$2)',[id,p.role==='owner'?null:p.id])).rows[0];
  if(!row||row.data.recheck?.status==='re-check failed')return new Response(null,{status:404});
  const image=confirmedLeverage(row.data.evidence)[i]?.proof?.image;
  if(!image)return new Response(null,{status:404});
  return new Response(Buffer.from(image.split(',')[1],'base64'),{headers:{'Content-Type':'image/jpeg','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow'}});
}
