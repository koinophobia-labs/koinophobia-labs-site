import {sign} from 'node:crypto';
import {required} from './config';
export type Resource={type:string;id:string;attributes?:Record<string,unknown>;relationships?:Record<string,{data?:{type:string;id:string};links?:{related?:string}}>};
export type Document={data:Resource|Resource[];included?:Resource[];links?:{next?:string}};
export async function appleRequest(path:string, finance=false) {
  const url=new URL(path,'https://api.appstoreconnect.apple.com');
  if(url.origin!=='https://api.appstoreconnect.apple.com'||!/^\/v[12]\//.test(url.pathname))throw Error('ASC_ORIGIN_INVALID');
  const prefix=finance?'APPSTORE_REPORTS_':'APPSTORE_';
  const now=Math.floor(Date.now()/1000);
  const b64=(v:object)=>Buffer.from(JSON.stringify(v)).toString('base64url');
  const content=b64({alg:'ES256',kid:required(prefix+'KEY_ID'),typ:'JWT'})+'.'+b64({iss:required(prefix+'ISSUER_ID'),iat:now,exp:now+600,aud:'appstoreconnect-v1'});
  const jwt=content+'.'+sign('sha256',Buffer.from(content),{key:required(prefix+'PRIVATE_KEY').replace(/\\n/g,'\n'),dsaEncoding:'ieee-p1363'}).toString('base64url');
  const r=await fetch(url,{headers:{Authorization:'Bearer '+jwt,Accept:finance?'application/a-gzip':'application/json'},signal:AbortSignal.timeout(12000),cache:'no-store',redirect:'error'});
  if(!r.ok)throw Error('ASC_HTTP_'+r.status);
  const bytes=Buffer.from(await r.arrayBuffer());if(bytes.length>16_000_000)throw Error('ASC_RESPONSE_TOO_LARGE');
  return bytes;
}
export async function document(path:string):Promise<Document>{return JSON.parse((await appleRequest(path)).toString());}
export async function resources(path:string,read=document) {
  const rows:Resource[]=[],included=new Map<string,Resource>(),seen=new Set<string>();
  while(path){if(seen.has(path)||seen.size>=20)throw Error('ASC_PAGINATION_BOUND');seen.add(path);const d=await read(path);if(!Array.isArray(d.data))throw Error('ASC_LIST_REQUIRED');rows.push(...d.data);for(const r of d.included||[])included.set(r.type+':'+r.id,r);path=d.links?.next||'';}
  return {rows,included};
}
