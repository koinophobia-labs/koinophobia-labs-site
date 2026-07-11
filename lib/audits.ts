import { Pool, type PoolClient, type QueryResultRow } from "pg";
export const auditStatuses = ["running", "draft", "ready", "failed"] as const;
export const findingSeverities = [
  "critical",
  "high",
  "medium",
  "low",
  "positive",
  "info",
] as const;
export const findingCategories = [
  "security",
  "seo",
  "mobile",
  "accessibility",
  "performance",
  "links",
  "content",
] as const;
export type AuditStatus = (typeof auditStatuses)[number];
export type FindingSeverity = (typeof findingSeverities)[number];
export type FindingCategory = (typeof findingCategories)[number];
export type AuditFinding = {
  id: string;
  category: FindingCategory;
  severity: FindingSeverity;
  title: string;
  evidence: string;
  recommendation: string;
  measured: boolean;
  selectedForProposal: boolean;
};
export type AuditMetrics = {
  httpStatus?: number;
  https?: boolean;
  responseMs?: number;
  htmlBytes?: number;
  title?: string;
  descriptionLength?: number;
  h1Count?: number;
  images?: number;
  imagesMissingAlt?: number;
  forms?: number;
  unlabeledFields?: number;
  brokenLinks?: number;
  redirected?: boolean;
  measurementNote: string;
};
export type AuditRecord = {
  id: string;
  leadId: string;
  status: AuditStatus;
  targetUrl: string;
  finalUrl: string | null;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  summary: string;
  findings: AuditFinding[];
  metrics: AuditMetrics;
  pagesChecked: number;
  linksChecked: number;
  internalNotes: string;
  errorMessage: string | null;
};
type Queryable = Pick<Pool, "query"> | Pick<PoolClient, "query">;
let pool: Pool | undefined;
const db = () => {
  if (!process.env.DATABASE_URL) throw Error("DATABASE_URL is not configured");
  return (pool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
  }));
};
const map = (r: QueryResultRow): AuditRecord => ({
  id: r.id,
  leadId: r.lead_id,
  status: r.status,
  targetUrl: r.target_url,
  finalUrl: r.final_url,
  startedAt: new Date(r.started_at).toISOString(),
  completedAt: r.completed_at ? new Date(r.completed_at).toISOString() : null,
  createdAt: new Date(r.created_at).toISOString(),
  updatedAt: new Date(r.updated_at).toISOString(),
  summary: r.summary,
  findings: r.findings,
  metrics: r.metrics,
  pagesChecked: r.pages_checked,
  linksChecked: r.links_checked,
  internalNotes: r.internal_notes,
  errorMessage: r.error_message,
});
export async function createAudit(
  leadId: string,
  targetUrl: string,
  q: Queryable = db(),
) {
  const r = await q.query(
    "insert into crm_audits(id,lead_id,target_url) values($1,$2,$3) returning *",
    [crypto.randomUUID(), leadId, targetUrl],
  );
  return map(r.rows[0]);
}
export async function completeAudit(
  id: string,
  data: {
    finalUrl: string;
    summary: string;
    findings: AuditFinding[];
    metrics: AuditMetrics;
    pagesChecked: number;
    linksChecked: number;
  },
  q: Queryable = db(),
) {
  const r = await q.query(
    "update crm_audits set status='draft',final_url=$1,summary=$2,findings=$3,metrics=$4,pages_checked=$5,links_checked=$6,completed_at=now(),updated_at=now(),error_message=null where id=$7 returning *",
    [
      data.finalUrl,
      data.summary,
      JSON.stringify(data.findings),
      JSON.stringify(data.metrics),
      data.pagesChecked,
      data.linksChecked,
      id,
    ],
  );
  return map(r.rows[0]);
}
export async function failAudit(
  id: string,
  message: string,
  q: Queryable = db(),
) {
  await q.query(
    "update crm_audits set status='failed',error_message=$1,completed_at=now(),updated_at=now() where id=$2",
    [message.slice(0, 1000), id],
  );
}
export async function getAudit(id: string, q: Queryable = db()) {
  const r = await q.query("select * from crm_audits where id=$1", [id]);
  return r.rows[0] ? map(r.rows[0]) : null;
}
export async function listAudits(leadId: string, q: Queryable = db()) {
  const r = await q.query(
    "select * from crm_audits where lead_id=$1 order by created_at desc",
    [leadId],
  );
  return r.rows.map(map);
}
export function validateAuditEdit(v: unknown) {
  if (!v || typeof v !== "object") return { errors: ["Invalid audit"] };
  const r = v as Record<string, unknown>,
    errors: string[] = [];
  if (
    typeof r.summary !== "string" ||
    !r.summary.trim() ||
    r.summary.length > 10000
  )
    errors.push("Invalid summary");
  const findings = Array.isArray(r.findings)
    ? r.findings.flatMap((x) => {
        if (!x || typeof x !== "object") return [];
        const f = x as Record<string, unknown>;
        return typeof f.id === "string" &&
          findingCategories.includes(f.category as FindingCategory) &&
          findingSeverities.includes(f.severity as FindingSeverity) &&
          typeof f.title === "string" &&
          f.title.trim() &&
          typeof f.evidence === "string" &&
          f.evidence.trim() &&
          typeof f.recommendation === "string" &&
          f.recommendation.trim() &&
          typeof f.measured === "boolean" &&
          typeof f.selectedForProposal === "boolean"
          ? [f as AuditFinding]
          : [];
      })
    : [];
  if (
    !findings.length ||
    findings.length !== (r.findings as unknown[])?.length ||
    findings.length > 100
  )
    errors.push("Invalid findings");
  if (typeof r.internalNotes !== "string" || r.internalNotes.length > 10000)
    errors.push("Invalid internalNotes");
  return errors.length
    ? { errors }
    : {
        edit: {
          summary: (r.summary as string).trim(),
          findings,
          internalNotes: r.internalNotes as string,
        },
      };
}
export async function updateAudit(
  id: string,
  edit: { summary: string; findings: AuditFinding[]; internalNotes: string },
  q: Queryable = db(),
) {
  const r = await q.query(
    "update crm_audits set summary=$1,findings=$2,internal_notes=$3,updated_at=now() where id=$4 and status in ('draft','ready') returning *",
    [edit.summary, JSON.stringify(edit.findings), edit.internalNotes, id],
  );
  return r.rows[0] ? map(r.rows[0]) : null;
}
export async function setAuditStatus(
  id: string,
  status: AuditStatus,
  q: Queryable = db(),
) {
  if (!["draft", "ready"].includes(status)) throw Error("INVALID_STATUS");
  const r = await q.query(
    "update crm_audits set status=$1,updated_at=now() where id=$2 and status in ('draft','ready') returning *",
    [status, id],
  );
  return r.rows[0] ? map(r.rows[0]) : null;
}
