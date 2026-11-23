import {leadHookTier} from './hook-tier';
import type { TeamLead } from './store';
import type { Deal } from './types';

export type BusinessHours = { source_url: string; checked_at: string; weekly: { day: number; open: number; close: number }[] };
export type CallGroup = 'best' | 'open' | 'soon' | 'closed' | 'unknown' | 'digital' | 'retained' | 'hold' | 'recheck';
export const GROUP_LABELS: Record<CallGroup, string> = {hold:'Speed only, not a call',recheck:'Recheck before calling',best:'Call now',open:'Open now',soon:'Opens soon',closed:'Closed',unknown:'Confirm time zone',digital:'Email & form only · email on hold',retained:'In progress & payment history'};
export function validTimeZone(zone: unknown): zone is string {
  if (typeof zone !== 'string' || !zone || zone.length > 100) return false;
  try { new Intl.DateTimeFormat('en-US', {timeZone:zone}).format(); return true; } catch { return false; }
}
export function partnerTimeZone(override: unknown, detected: unknown) {
  return validTimeZone(override) ? override : validTimeZone(detected) ? detected : 'America/New_York';
}
export function hasPhone(lead: Pick<TeamLead,'phone'>) { return /^1?\d{10}$/.test(lead.phone.replace(/\D/g,'')); }
export function visibleCallLead(lead: TeamLead, deals: Deal[] = []) {
  return !lead.opted_out && lead.recheck?.status !== 're-check failed' &&
    !/^(not interested|fixed on recheck|don['’]t call|do not call)$/i.test(lead.call_outcome ?? '') &&
    !deals.some(d => d.lead_id === lead.id && ['Lost','Client paid','Delivered'].includes(d.stage));
}
const formatters = new Map<string,Intl.DateTimeFormat>();
function parts(at: Date, zone: string) {
  let f = formatters.get(zone);
  if (!f) { f = new Intl.DateTimeFormat('en-US',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}); formatters.set(zone,f); }
  const p = Object.fromEntries(f.formatToParts(at).map(p=>[p.type,p.value]));
  return {date:Date.UTC(+p.year,+p.month-1,+p.day),minute:+p.hour*60+(+p.minute)};
}
export const timeAt = (at: Date, zone: string) => new Intl.DateTimeFormat('en-US',{timeZone:zone,hour:'numeric',minute:'2-digit'}).format(at);
// Resolve a local calendar date independently each time: adding 24 elapsed hours
// would shift the opening time across a daylight-saving transition.
export function localInstant(date: number, minute: number, zone: string) {
  const wall=date+minute*60_000;let t=wall;
  for(let i=0;i<4;i++){const p=parts(new Date(t),zone);const delta=wall-(p.date+p.minute*60_000);if(!delta)break;t+=delta;}
  const p=parts(new Date(t),zone);
  return p.date===date && p.minute===minute ? new Date(t) : null;
}
export function zoneChip(zone: string, at: Date) {
  const name=new Intl.DateTimeFormat('en-US',{timeZone:zone,timeZoneName:'short'}).formatToParts(at).find(p=>p.type==='timeZoneName')?.value ?? zone;
  return /^(EST|EDT)$/.test(name)?'ET':/^(CST|CDT)$/.test(name)?'CT':/^(MST|MDT)$/.test(name)?(zone==='America/Phoenix'?'MT (AZ)':'MT'):/^(PST|PDT)$/.test(name)?'PT':name;
}
function intervals(lead: TeamLead, day: number, at: Date) {
  const h=lead.business_hours;
  const verified=!!h && /^https:\/\//.test(h.source_url) && Number.isFinite(Date.parse(h.checked_at)) && Date.parse(h.checked_at)<=at.getTime() && Array.isArray(h.weekly) && h.weekly.every(x=>Number.isInteger(x.day)&&x.day>=0&&x.day<=6&&Number.isInteger(x.open)&&Number.isInteger(x.close)&&x.open>=0&&x.open<x.close&&x.close<=1440);
  const hours=verified?h.weekly.filter(x=>x.day===day).map(x=>[x.open,x.close]):day>0&&day<6?[[540,1020]]:[];
  // Restaurants' lunch service is always protected, even with recorded hours.
  return {verified, periods:lead.vertical?.toLowerCase()==='restaurant'?hours.flatMap(([s,e])=>[[s,Math.min(e,690)],[Math.max(s,810),e]].filter(([a,b])=>a<b)):hours};
}
export type ScheduledLead = {lead:TeamLead;group:CallGroup;localTime:string;chip:string;next:Date|null;status:string;bestWindow:string;assumedHours:boolean};
export function scheduleLead(lead: TeamLead, now: Date, partnerZone: string): ScheduledLead {
  const base={lead,group:'unknown' as CallGroup,localTime:'Time zone needed',chip:'?',next:null as Date|null,status:'Confirm the business time zone before calling.',bestWindow:'',assumedHours:true};
  if(!validTimeZone(lead.time_zone))return hasPhone(lead)?base:{...base,group:'digital',status:'Email is on hold. Review the contact form separately.'};
  const zone=lead.time_zone,local=parts(now,zone),today=intervals(lead,new Date(local.date).getUTCDay(),now);
  const windows:{start:Date;end:Date}[]=[],best:{start:Date;end:Date}[]=[];
  for(let d=0;d<8;d++){
    const date=local.date+d*86400_000;
    for(const [s,e]of intervals(lead,new Date(date).getUTCDay(),now).periods){
      const start=localInstant(date,s,zone),end=localInstant(date,e===1440?0:e,zone);
      const finish=e===1440?localInstant(date+86400_000,0,zone):end;
      if(start&&finish&&finish>now)windows.push({start,end:finish});
      for(const [a,b]of [[600,690],[810,900]]){
        const lo=Math.max(a,s),hi=Math.min(b,e);if(lo>=hi)continue;
        const start=localInstant(date,lo,zone),end=localInstant(date,hi,zone);
        if(start&&end&&end>now)best.push({start,end});
      }
    }
  }
  windows.sort((a,b)=>+a.start-+b.start);best.sort((a,b)=>+a.start-+b.start);
  const active=windows.find(w=>w.start<=now&&w.end>now),next=active?.start??windows[0]?.start??null;
  const inBest=best.some(w=>w.start<=now&&w.end>now),soon=next&&+next-+now<=120*60_000;
  const group:CallGroup=!hasPhone(lead)?'digital':active?(inBest?'best':'open'):soon?'soon':'closed';
  const dayLabel=(date:Date,tz:string)=>{const delta=(parts(date,tz).date-parts(now,tz).date)/86400_000;return delta===0?'today':delta===1?'tomorrow':new Intl.DateTimeFormat('en-US',{timeZone:tz,weekday:'long'}).format(date);};
  const nextLabel=next?`${dayLabel(next,zone)} after ${timeAt(next,zone)} their time = ${timeAt(next,partnerZone)} ${dayLabel(next,partnerZone)} your time`:'after verifying business hours';
  const firstBest=best[0];
  const bestWindow=firstBest?`Best ${dayLabel(firstBest.start,partnerZone)}: ${best.filter(w=>parts(w.start,zone).date===parts(firstBest.start,zone).date).map(w=>`${timeAt(w.start,partnerZone)}–${timeAt(w.end,partnerZone)}`).join(' or ')} your time`:'No best window in recorded hours';
  return {...base,group,localTime:`${timeAt(now,zone)} there`,chip:zoneChip(zone,now),next,assumedHours:!today.verified,bestWindow,
    status:group==='digital'?'Email is on hold. Review the contact form separately.':active?`${inBest?'Best window':'Open'} · until ${timeAt(active.end,zone)} there`:soon?`Opens in ${Math.ceil((+next!-+now)/60_000)} min (${timeAt(next!,partnerZone)} your time)`: `Call ${nextLabel}`};
}
export function callQueue(leads:TeamLead[], deals:Deal[], now:Date, partnerZone:string) {
  const order:CallGroup[]=['best','open','soon','closed','unknown','digital','recheck','hold'];
  const tierOrder={A:0,B:1,recheck:2,hold:3};
  const callable=(r:ScheduledLead)=>Number(!['best','open'].includes(r.group));
  return leads.filter(l=>visibleCallLead(l,deals)).map(l=>{
    const row=scheduleLead(l,now,partnerZone),tier=leadHookTier(l,now);
    return tier==='hold'||tier==='recheck'?{...row,group:tier,status:tier==='recheck'?'Recheck before calling: evidence must be from the last 48 hours.':'Speed only, not a call. No confirmed visible break.',bestWindow:''}:row;
  }).sort((a,b)=>callable(a)-callable(b)||tierOrder[leadHookTier(a.lead,now)]-tierOrder[leadHookTier(b.lead,now)]||order.indexOf(a.group)-order.indexOf(b.group)||(b.lead.leverage_score??0)-(a.lead.leverage_score??0)||(b.lead.fit_score??0)-(a.lead.fit_score??0)||a.lead.id.localeCompare(b.lead.id));
}
export function callHeader(rows:ScheduledLead[], now:Date, zone:string) {
  const prefix=`${timeAt(now,zone)} your time: `,open=rows.filter(r=>['best','open'].includes(r.group));
  if(open.length){const zones=[...new Set(open.map(r=>r.chip))].join(', ');return `${prefix}${open.length} ${zones} ${open.length===1?'business':'businesses'} open now.`;}
  const next=rows.filter(r=>['soon','closed'].includes(r.group)&&r.next&&r.next>now).sort((a,b)=>+a.next!-+b.next!)[0];
  return prefix+(next?`Nobody’s open now. First calls ${new Intl.DateTimeFormat('en-US',{timeZone:zone,weekday:'short'}).format(next.next!)} at ${timeAt(next.next!,zone)} (${next.chip} businesses).`:'No callable leads with confirmed time zones.');
}

// Server snapshots already enforce partnerLeadVisible. Keep their in-flight and
// payment-history rows without presenting unsafe contacts as a calling queue.
export function displayCallQueue(leads:TeamLead[],deals:Deal[],now:Date,zone:string) {
  const callable=callQueue(leads.filter(l=>hasPhone(l)&&validTimeZone(l.time_zone)),deals,now,zone);
  const ids=new Set(callable.map(r=>r.lead.id));
  return [...callable,...leads.filter(l=>!ids.has(l.id)).map(lead=>({...scheduleLead(lead,now,zone),group:'retained' as const,status:'Retained for your existing conversation or payment history.',bestWindow:''}))];
}
