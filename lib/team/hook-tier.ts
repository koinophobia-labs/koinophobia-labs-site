import type { DisplayFinding } from './plain-findings';

export type HookTier = 'A' | 'B' | 'hold' | 'recheck';
export type HookFinding = DisplayFinding & {confidence?:string;measured_at?:string;leverage?:number};
export const FRESH_MS = 48 * 60 * 60 * 1000;
const weights: Record<string,number> = {'Dead contact / booking / order link':96,'Closed Google Form':95,'Booking widget failure':94,'Insecure form':91,'HTTPS failure':90,'Wrong key link':86,'Unfinished content':84,'Broken image':78,'Mobile layout':76,'Expiring certificate':74,'Mobile contact route':66,'Lighthouse mobile performance':64,'Slow page':58};
export function topFinding(findings: readonly HookFinding[] = []) {
  return findings.filter(f=>f.confidence==='confirmed').sort((a,b)=>(weights[b.check??b.name??'']??0)-(weights[a.check??a.name??'']??0))[0];
}
export function findingTier(f?: HookFinding, now = new Date()): 'A'|'B'|'hold' {
  switch(f?.check??f?.name){
    case 'Dead contact / booking / order link': case 'Closed Google Form': case 'Booking widget failure':
    case 'HTTPS failure': case 'Wrong key link': case 'Unfinished content': case 'Insecure form': return 'A';
    case 'Mobile layout': return ['horizontal-overflow','zoomed-out','overlapping-targets','small-crowded-primary','tiny-primary-text'].includes(f?.key??'')?'B':'hold';
    case 'Broken image': case 'Mobile contact route': return 'B';
    case 'Expiring certificate': {
      const date=(f?.measurement??f?.detail??f?.key??'').match(/\d{4}-\d{2}-\d{2}(?:T[\d:.]+Z)?/)?.[0];
      const remaining=date?Date.parse(date)-now.getTime():NaN;
      return remaining>=0&&remaining<=30*86400_000?'B':'hold';
    }
    default:return 'hold';
  }
}
export function hookTier(findings: readonly HookFinding[] = [], now = new Date(), recheck?: {status:string;checked_at?:string}): HookTier {
  if(recheck?.status==='re-check failed')return 'hold';
  const f=topFinding(findings),tier=findingTier(f,now);
  if(tier==='hold')return tier;
  const at=Date.parse(f?.measured_at??recheck?.checked_at??'');
  return Number.isFinite(at)&&at<=now.getTime()&&now.getTime()-at<=FRESH_MS?tier:'recheck';
}
export function leadHookTier(lead:{evidence?:HookFinding[];recheck?:{status:string;checked_at?:string;findings?:HookFinding[]}},now=new Date()) {
  return hookTier(lead.recheck?.findings??lead.evidence,now,lead.recheck);
}
export const tierLabel = (tier:HookTier) => tier==='A'||tier==='B'?`Tier ${tier}`:tier==='recheck'?'Recheck before calling':'Speed only, not a call';
