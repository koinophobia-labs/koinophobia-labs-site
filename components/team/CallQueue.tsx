"use client";
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import type {TeamSnapshot,TeamLead} from '@/lib/team/store';
import {displayCallQueue,callHeader,GROUP_LABELS,partnerTimeZone,scheduleLead} from '@/lib/team/call-schedule';
export function useCallClock(override?:string) {
  const [clock,setClock]=useState<{now:Date;zone:string}|null>(null);
  useEffect(()=>{const tick=()=>setClock({now:new Date(),zone:partnerTimeZone(override,Intl.DateTimeFormat().resolvedOptions().timeZone)});tick();const timer=setInterval(tick,30_000);return()=>clearInterval(timer);},[override]);
  return clock;
}
export function LeadCallTime({lead,override}:{lead:TeamLead;override?:string}) {
  const clock=useCallClock(override);if(!clock)return null;
  const row=scheduleLead(lead,clock.now,clock.zone);
  return <div className="call-time"><span className="team-tag">{row.chip}</span> {row.localTime}<small>{row.status}</small><small>{row.bestWindow}</small></div>;
}
export function CallQueue({data,selected,onSelect,search='',compact=false}:{data:TeamSnapshot;selected?:string;onSelect:(id:string)=>void;search?:string;compact?:boolean}) {
  const clock=useCallClock(data.partnerTimeZone);
  if(!clock)return <p role="status">Checking local calling times…</p>;
  const all=displayCallQueue(data.leads,data.deals,clock.now,clock.zone),rows=all.filter(r=>r.lead.business.toLowerCase().includes(search.toLowerCase()));
  return <section className={'call-queue'+(compact?' is-compact':'')} aria-label="Call now queue">
    <div className="call-now-header"><h2>Call now</h2><p role="status">{callHeader(all,clock.now,clock.zone)}</p><small>Your time zone: {clock.zone.replaceAll('_',' ')} · <Link href="/team/account">Change</Link></small></div>
    <p className="call-hours-note">Hours default to 9 AM–5 PM, Monday–Friday, unless published hours are recorded. Confirm before dialing. Restaurants skip 11:30 AM–1:30 PM local.</p>
    {!rows.length&&<p>No available leads match this view.</p>}
    {(Object.keys(GROUP_LABELS) as (keyof typeof GROUP_LABELS)[]).map(group=>{
      const items=rows.filter(r=>r.group===group);if(!items.length)return null;
      return <section className={'call-group call-group-'+group} key={group} aria-label={GROUP_LABELS[group]}><h3>{GROUP_LABELS[group]} <span>{items.length}</span></h3>
        {items.map(r=><button type="button" className={'team-lead-row call-queue-row '+(selected===r.lead.id?'selected':'')} key={r.lead.id} onClick={()=>onSelect(r.lead.id)}>
          <span className="call-queue-content"><strong>{r.lead.business}</strong><span className="call-row-time"><span className="team-tag">{r.chip}</span> {r.localTime}</span><small>{r.status}</small>{r.bestWindow&&<small>{r.bestWindow}</small>}<small>{r.assumedHours?'Default hours · verify with business':'Published business hours'}{group==='digital'||group==='retained'?'':' · Phone'}</small></span>
        </button>)}
      </section>;
    })}
  </section>;
}
export function TimeZoneSettings({data}:{data:TeamSnapshot}) {
  const router=useRouter();
  const [value,setValue]=useState(data.partnerTimeZone??''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
  const clock=useCallClock(value);
  const options=[...new Set([data.partnerTimeZone,...Intl.supportedValuesOf('timeZone'),'America/New_York','America/Chicago','America/Denver','America/Phoenix','America/Los_Angeles'].filter((x):x is string=>!!x))].sort();
  return <section className="team-card"><h2>Your calling time zone</h2><p>Best windows and next opening times use this time zone on your computer and phone.</p><form onSubmit={async e=>{e.preventDefault();setBusy(true);setMessage('');try{const r=await fetch('/team/api/time-zone',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({timeZone:value})});if(!r.ok)throw Error('Unable to save time zone.');setMessage('Time zone saved for your account.');router.refresh();}catch{setMessage('Unable to save time zone. Try again.');}finally{setBusy(false);}}}>
    <label htmlFor="partner-time-zone">Your time zone</label><select id="partner-time-zone" value={value} onChange={e=>setValue(e.target.value)}><option value="">Automatic · browser time zone</option>{options.map(z=><option value={z} key={z}>{z.replaceAll('_',' ')}</option>)}</select><p>Currently: {clock?.zone.replaceAll('_',' ')??'Detecting…'}</p><button className="team-button" disabled={busy||data.readonly}>Save time zone</button>{message&&<p role="status">{message}</p>}
  </form></section>;
}
