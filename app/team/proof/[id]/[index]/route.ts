import {currentPartner} from '@/lib/team/session';
import {teamDatabase,hostedPreview} from '@/lib/team/db';
export const runtime='nodejs';
export async function GET(_request:Request,{params}:{params:Promise<{id:string;index:string}>}){
 const p=await currentPartner();if(!p||hostedPreview())return new Response(null,{status:401});
 const {id,index}=await params;const i=Number(index);
 if(!Number.isInteger(i)||i<0||i>30)return new Response(null,{status:404});
 const row=(await teamDatabase().query('select data from team_site_checks where id=$1 and ($2::text is null or partner_id=$2)',[id,p.role==='owner'?null:p.id])).rows[0];
 const finding=row?.data?.findings?.[i];const image=finding?.proof?.image;
 if(finding?.confidence!=='confirmed'||typeof image!=='string'||!image.startsWith('data:image/jpeg;base64,'))return new Response(null,{status:404});
 const bytes=Buffer.from(image.slice('data:image/jpeg;base64,'.length),'base64');
 return new Response(bytes,{headers:{'Content-Type':'image/jpeg','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow'}});
}
