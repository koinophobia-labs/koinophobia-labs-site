import {currentPartner} from '@/lib/team/session';
import {teamDatabase,hostedPreview} from '@/lib/team/db';
import {confirmedLeverage} from '@/lib/team/leverage';
import {visibleLead} from '@/lib/team/store';
import {Fault} from '@/lib/team/domain';
export const runtime='nodejs';
export async function GET(_request:Request,{params}:{params:Promise<{id:string;index:string}>}){
  const p=await currentPartner();if (p?.role === "affiliate") return new Response(null, {status:404});
  if(!p||hostedPreview())return new Response(null,{status:401});
  const {id,index}=await params;const i=Number(index);
  if(!Number.isInteger(i)||i<0||i>30)return new Response(null,{status:404});
  let row;
  try { row=await visibleLead(teamDatabase(),p,id); }
  catch(e) { if(e instanceof Fault && e.status===404)return new Response(null,{status:404}); throw e; }
  if(!row||row.data.recheck?.status==='re-check failed')return new Response(null,{status:404});
  const image=confirmedLeverage(row.data.evidence)[i]?.proof?.image;
  if(!image)return new Response(null,{status:404});
  return new Response(Buffer.from(image.split(',')[1],'base64'),{headers:{'Content-Type':'image/jpeg','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow'}});
}
