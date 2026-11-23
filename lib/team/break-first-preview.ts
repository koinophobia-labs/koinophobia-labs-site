import {leadHookTier} from "./hook-tier";
import type {TeamLead} from './store';
import type {CallState} from './call-domain';
import {breakFirstScript,findingHook} from './scripts';
import {checkItYourself,whatFixedMeans} from './plain-findings';
import {SERVICES} from './config';
export const PREVIEW_CODE='wo0303demo';
export function previewLeads(now=new Date()):TeamLead[] {
  const base={partner_id:'demo-a',contact:'Demo owner',phone:'2025550100',email:'',website:'https://example.test',notes:'Fictional fixture only',channel:'Online',created_at:now.toISOString(),time_zone:'America/Chicago'};
  return [
    {...base,id:'wo0303-break',business:'Fictional Studio · demo',evidence:[{check:'Dead contact / booking / order link',key:'http-404',label:'Book Now',confidence:'confirmed',measurement:'The published action URL returned HTTP 404 in Chromium using GET.',measured_at:now.toISOString(),url:'https://example.test/book'}]},
    {...base,id:'wo0303-hold',business:'Fictional Speed Example · demo',evidence:[{check:'Slow page',key:'load',confidence:'confirmed',measurement:'Three fresh Chromium loads: median LCP 1800 ms; median load 9500 ms.',measured_at:now.toISOString()}]},
  ];
}
export function previewCallState(lead=previewLeads()[0]):CallState {
  const tier=leadHookTier(lead);
  if(tier==='hold'||tier==='recheck')return {lead,details:{cell:'',outcome:null,follow_up_at:null},deal:null,page:null,hook_tier:tier,checked_at:lead.evidence?.[0]?.measured_at,problem:null,proof_available:false,script:breakFirstScript(),commission:0};
  const f=lead.evidence![0],service=SERVICES.find(s=>s.id==='fix')!;
  return {lead,details:{cell:'2025550100',outcome:null,follow_up_at:null},deal:{id:'wo0303-demo',lead_id:lead.id,partner_id:'demo-a',services:['fix'],price:29900,monthly:0,scope:service.scope,approved:true,lost_reason:'',stage:'Lead',created_at:lead.created_at,updated_at:lead.created_at},page:{code:PREVIEW_CODE,proof_reviewed_by:'fixture',opened_at:null,checkout_started_at:null,paid_at:null,expires_at:new Date(Date.parse(lead.created_at)+7*86400_000).toISOString()},hook_tier:'A',checked_at:f.measured_at,check_it_yourself:checkItYourself(f),finding_label:'Book Now',problem:f.measurement,plain_problem:"Your 'Book Now' button goes to a page that doesn't work.",say_it:findingHook(f),proof_available:true,script:breakFirstScript(f),commission:0};
}
export function previewDeal() {
  const state=previewCallState();
  return {...state.page,lead:state.lead,deal:state.deal,is_demo:true,problem:state.problem,plain_problem:state.plain_problem,impact:null,verify_url:null,proof_image:true,proof_at:state.checked_at,proof_caption:`What a visitor saw when tapping 'Book Now' on ${new Date(state.checked_at!).toLocaleDateString('en-US',{timeZone:'UTC'})}.`,fixed_means:whatFixedMeans(state.lead!.evidence![0])};
}
