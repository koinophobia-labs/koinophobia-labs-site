import { InvalidNotification } from '@/lib/appstore/apple';
import { receive } from '@/lib/appstore/service';
import { teamDatabase } from '@/lib/team/db';
export const runtime='nodejs';
export const maxDuration=60;
export async function POST(request:Request) {
  if (process.env.APPSTORE_NOTIFICATIONS_ENABLED!=='true' || process.env.VERCEL_ENV==='preview') return Response.json({error:'Unavailable'},{status:503});
  try {
    // Bound bytes even when Content-Length is absent or dishonest.
    const reader=request.body?.getReader();
    if (!reader) return Response.json({error:'Invalid request'},{status:400});
    const chunks:Uint8Array[]=[]; let size=0;
    while(true) { const {value,done}=await reader.read(); if(done) break; size+=value.byteLength; if(size>256*1024) {await reader.cancel(); return Response.json({error:'Too large'},{status:413});} chunks.push(value); }
    let body;
    try { body=JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return Response.json({error:'Invalid request'},{status:400}); }
    if (typeof body?.signedPayload!=='string') return Response.json({error:'Invalid request'},{status:400});
    await receive(body.signedPayload,teamDatabase());
    return Response.json({ok:true});
  } catch(e) {
    // No signed payloads, account tokens, key contents or provider errors in logs.
    return Response.json({error:e instanceof InvalidNotification?'Invalid notification':'Retry later'},{status:e instanceof InvalidNotification?400:503});
  }
}
