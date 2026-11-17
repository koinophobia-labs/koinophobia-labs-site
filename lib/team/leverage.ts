import {plainFinding} from "./plain-findings";
import {isConfirmed,rankFindings,impactLine,verifyLink,leverageScore,type Finding as AuditFinding} from '@koinophobia/site-auditor/model';

export function confirmedLeverage(rows:unknown):AuditFinding[]{
  if(!Array.isArray(rows))return [];
  return rankFindings(rows.filter((f):f is AuditFinding=>!!f&&typeof f==='object'&&isConfirmed(f)));
}
export function findingSummary(f:AuditFinding){
  return {label:f.label,page_name:f.page_name,url:f.url,plain:plainFinding(f),key:f.key,check:f.check,measurement:f.measurement,confidence:f.confidence,impact:impactLine(f),verify_url:verifyLink(f),leverage:leverageScore(f),measured_at:f.measured_at};
}
export function strongestOpener(rows:unknown):string|undefined {
  const f=confirmedLeverage(rows)[0];
  return f?`${f.measurement} ${impactLine(f)}`:undefined;
}
