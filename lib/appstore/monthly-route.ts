import type {NextRequest} from 'next/server';
import type {Partner} from '../team/types';
import {Fault,owner} from '../team/domain';
import {isTrustedMutationRequest} from '../security/origin';

export function receiptHandler(dependencies:{actor:()=>Promise<Partner|null>;available:()=>boolean;execute:(actor:Partner,input:{month:unknown;received:unknown})=>Promise<unknown>}) {
  return async(request:NextRequest)=>{
    try{
      if(!isTrustedMutationRequest(request))throw new Fault('Request origin rejected.',403);
      const actor=await dependencies.actor();if(!actor)throw new Fault('Please sign in.',401);
      owner(actor);if(!actor.active)throw new Fault('Active owner required.',403);
      if(!dependencies.available())throw new Fault('Monthly payouts are unavailable in this environment.',503);
      const reader=request.body?.getReader();if(!reader)throw new Fault('Request body required.');
      const chunks:Uint8Array[]=[];let size=0;
      while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>2048){await reader.cancel();throw new Fault('Request too large.',413);}chunks.push(value);}
      let input;try{input=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new Fault('Invalid request.');}
      if(!input||Array.isArray(input)||typeof input!=='object')throw new Fault('Invalid request.');
      const result=await dependencies.execute(actor,{month:input.month,received:input.received});
      return Response.json({ok:true,result},{headers:{'Cache-Control':'no-store'}});
    }catch(e){return Response.json({error:e instanceof Fault?e.message:'Payment is not confirmed. Review the monthly record before retrying.'},{status:e instanceof Fault?e.status:503,headers:{'Cache-Control':'no-store'}});}
  };
}
