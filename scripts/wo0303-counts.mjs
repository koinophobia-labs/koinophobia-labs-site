import {readFileSync,writeFileSync,readdirSync,statSync} from 'node:fs';
import {join} from 'node:path';
import {callNow as before} from '/Volumes/KoiArchive/WO-0295/resume-20261113T0530Z/site/lib/team/call-domain.ts';
import {callNow as after} from '../lib/team/call-domain.ts';
import {hookTier,findingTier,topFinding} from '../lib/team/hook-tier.ts';
import {confirmedLeverage} from '../lib/team/leverage.ts';
const roots=['/Users/koi/SalesPrivate/leadgen','/Volumes/KoiArchive/WO-0273/private'];
function files(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()&&!['auditor-v2','refill-auditor-v2','node_modules','.git'].includes(e.name)?files(join(dir,e.name)):e.isFile()&&e.name==='leads.json'?[join(dir,e.name)]:[]);}
const paths=roots.flatMap(files).sort((a,b)=>statSync(a).mtimeMs-statSync(b).mtimeMs),unique=new Map();
for(const path of paths){const rows=JSON.parse(readFileSync(path,'utf8'));if(!Array.isArray(rows))continue;for(const l of rows){if(!l.website)continue;const key=new URL(l.website).hostname.replace(/^www\./,'');const prev=unique.get(key);if(!prev||Date.parse(l.created_at??'')>=Date.parse(prev.created_at??''))unique.set(key,l);}}
const now=new Date(),rows=[...unique.values()];
const empty=()=>({A:0,B:0,hold:0,recheck:0});
const group=(leads,fresh)=>leads.reduce((s,l)=>{const findings=confirmedLeverage(l.evidence);s[fresh?hookTier(findings,now,l.recheck):findingTier(topFinding(findings),now)]++;return s;},empty());
const result={at:now.toISOString(),method:'Latest created record per normalized hostname from saved lead files; no database read. Before/after use the same instant and existing hours/phone rules.',files:paths.length,total:rows.length,allByContentTier:group(rows,false),allByFreshnessTier:group(rows,true),callNowBeforeByContentTier:group(before(rows,[],now),false),callNowAfterByTier:group(after(rows,[],now),true)};
writeFileSync('/Volumes/KoiArchive/WO-0303/evidence/tier-counts.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
