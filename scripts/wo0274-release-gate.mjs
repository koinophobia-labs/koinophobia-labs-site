import {readFileSync,appendFileSync} from 'node:fs';
const root=process.env.WO0274_HQ||'/Users/koi/KoinophobiaLabs';
const statuses=Object.fromEntries(['WO-0270','WO-0272'].map(id=>[id,/^status:\s*(.+)$/m.exec(readFileSync(`${root}/work-orders/${id}.md`,'utf8'))?.[1].trim()||'unknown']));
const allowed=Object.values(statuses).every(s=>['complete','done','blocked'].includes(s));
const result={checked_at:new Date().toISOString(),statuses,allowed};
if(process.env.WO0274_GATE_LOG)appendFileSync(process.env.WO0274_GATE_LOG,JSON.stringify(result)+'\n');
console.log(JSON.stringify(result));
if(!allowed)process.exitCode=1;
