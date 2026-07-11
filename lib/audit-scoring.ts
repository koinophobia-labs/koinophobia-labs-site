import type { NewFinding } from "@/lib/audits";

export const scoreCategories=["security","seo","mobile","accessibility","performance","broken_links","conversion","contact_visibility","content_clarity"] as const;
export type ScoreCategory=(typeof scoreCategories)[number];
export type CategoryScore={score:number|null;available:boolean;deductions:number;findingCount:number;explanation:string};
export type AuditScores={overall:number|null;categories:Record<ScoreCategory,CategoryScore>;version:"audit-score-v1";inputs:{weights:Record<string,number>;severityDeductions:Record<string,number>}};
const severityDeductions={critical:35,high:20,medium:10,low:4,informational:0,positive:0};
const weights:Record<ScoreCategory,number>={security:15,seo:15,mobile:10,accessibility:15,performance:10,broken_links:10,conversion:10,contact_visibility:8,content_clarity:7};

export function calculateAuditScores(findings:NewFinding[],availability:Partial<Record<ScoreCategory,boolean>>):AuditScores{
 const categories={} as Record<ScoreCategory,CategoryScore>;
 for(const category of scoreCategories){const available=availability[category]===true,items=findings.filter(f=>f.category===category),deductions=items.reduce((sum,f)=>sum+severityDeductions[f.severity],0),score=available?Math.max(0,100-deductions):null;categories[category]={score,available,deductions,findingCount:items.length,explanation:available?`Started at 100 and deducted ${deductions} severity-weighted points from ${items.length} findings.`:"Not scored because this audit did not produce a supported measurement for the category."}}
 const measured=scoreCategories.filter(c=>categories[c].available),weightTotal=measured.reduce((n,c)=>n+weights[c],0),overall=weightTotal?Math.round(measured.reduce((n,c)=>n+(categories[c].score??0)*weights[c],0)/weightTotal):null;
 return{overall,categories,version:"audit-score-v1",inputs:{weights,severityDeductions}};
}
