import {createHash} from 'node:crypto';
import {confirm,type Proof,type Observation} from '@koinophobia/site-auditor';

export const proof:Proof={url:'https://fictional.example/',captured_at:'2026-11-10T12:00:00Z',viewport:{width:390,height:844},image:'data:image/jpeg;base64,'+Buffer.from('FICTIONAL TEST IMAGE').toString('base64'),sha256:createHash('sha256').update('FICTIONAL TEST IMAGE').digest('hex')};
export function confirmedEvidence(){
 const a:Observation={run_id:'fictional-a',check:'Mobile layout',key:'horizontal-overflow',url:proof.url,measured_at:proof.captured_at,measurement:'Fictional rendered horizontal overflow of 90 px.',proof};
 const b:Observation={...a,run_id:'fictional-b',measured_at:'2026-11-10T12:01:00Z'};
 return {...confirm([b],[a])[0],severity:25,impact:'Fictional mobile friction'};
}
