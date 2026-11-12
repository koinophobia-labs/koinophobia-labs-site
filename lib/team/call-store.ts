import {plainFinding, sayFinding, slowSeconds, storedProblemFinding} from "./plain-findings";
import {slowSiteScript} from "./scripts";
import { randomInt, randomUUID, createHash } from "node:crypto";
import {confirmedLeverage} from './leverage';
import {impactLine,verifyLink,type Finding as AuditFinding} from '@koinophobia/site-auditor/model';
import type { Queryable } from "../payments";
import type { Partner, Deal } from "./types";
import { scopedLead, visibleLead, scopedDeal, isOptedOut, saveQuote, type TeamLead } from "./store";
import { Fault, textInput, quoteDraft } from "./domain";
import { isStandardQuote, quotePaymentLink } from "./payment-links";
import {
  CALL_OUTCOMES,
  callScript,
  phoneNumber,
  type CallState,
  type CallOutcome,
} from "./call-domain";
const alphabet = "23456789abcdefghjkmnpqrstuvwxyz";
export const newDealCode = () =>
  Array.from({ length: 10 }, () => alphabet[randomInt(alphabet.length)]).join(
    "",
  );
export function normalizeCode(value: string) {
  const code = value.toLowerCase();
  return /^[23456789abcdefghjkmnpqrstuvwxyz]{10}$/.test(code) ? code : null;
}
function shaped(row: Record<string, unknown>): TeamLead {
  return {
    ...(row.data as object),
    ...row,
    data: undefined,
  } as unknown as TeamLead;
}
function assertRecheck(row: unknown) {
  const lead = shaped(row as Record<string, unknown>);
  if (lead.recheck?.status === "re-check failed") throw new Fault("Don’t call — re-check failed. Ask Blake to review a confirmed re-check.");
}
export async function activeLead(q: Queryable, p: Partner, id: string) {
  const l = await scopedLead(q, p, id);
  if (await isOptedOut(q, l)) throw new Fault("This contact has opted out.");
  await q.query(
    "insert into team_active_leads(partner_id,lead_id) values($1,$2) on conflict(partner_id) do update set lead_id=excluded.lead_id,updated_at=now()",
    [p.id, id],
  );
  // Payment preparation has its own endpoint and must never roll back navigation.
  return { ok: true };
}
type ProofFinding = AuditFinding & {detail?:string};
export function confirmedProof(findings: unknown) {
  return (confirmedLeverage(findings)[0] as ProofFinding|undefined)??null;
}
async function leadFindings(q: Queryable, l: TeamLead): Promise<ProofFinding[]> {
  // Prefer the latest audit, including a failed recheck: never fall back to stale positive proof.
  const canonical = new URL(l.website); canonical.hash = "";
  const checks = await q.query(
    "select data from team_site_checks where partner_id=$1 and (data->>'url'=any($2::text[]) or data->>'final_url'=any($2::text[])) order by coalesce(data->>'measured_at',to_char(created_at at time zone 'UTC','YYYY-MM-DD\"T\"HH24:MI:SS.MS\"Z\"')) desc,created_at desc limit 1",
    [l.partner_id, [...new Set([l.website, canonical.href])]],
  );
  if (l.recheck?.status === "re-check failed") return [];
  if (checks.rows[0]) return checks.rows[0].data.findings || [];
  return (l.evidence as ProofFinding[]) || [];
}
function confirmedFinding(findings: ProofFinding[]) {
  return confirmedProof(findings) ?? findings.find(f => f.confidence === "confirmed" && (f.measurement || f.detail)) ?? null;
}
export async function leadProof(q: Queryable, l: TeamLead) {
  return confirmedProof(await leadFindings(q, l));
}
// Called only inside the team-write transaction, never by the polling GET.
export async function prepareCall(q: Queryable, p: Partner, id: string) {
  const l = shaped(await scopedLead(q, p, id) as unknown as Record<string, unknown>);
  if (l.recheck?.status === "re-check failed" || l.call_outcome === "Not interested" || await isOptedOut(q, l)) return { ok: true };
  if (!confirmedFinding(await leadFindings(q, l))) return { ok: true };
  const deals = (await q.query("select * from team_deals where lead_id=$1 and partner_id=$2 order by created_at desc,id", [id, l.partner_id])).rows as Deal[];
  let deal = deals.find(d => !["Client paid", "Delivered", "Lost"].includes(d.stage));
  if (!deal) {
    const offer = l.suggested_offer;
    if (!offer || !["fix", "tune", "care"].includes(offer.id)) return { ok: true };
    const draft = quoteDraft([offer.id]);
    if (!isStandardQuote(draft) || offer.price !== draft.price) return { ok: true };
    const saved = await saveQuote(q, p, { lead_id: id, services: [offer.id] });
    deal = await scopedDeal(q, p, saved.id) as Deal;
  }
  if (!quotePaymentLink(deal)) return { ok: true };
  const existing = (await q.query("select code from team_deal_pages where deal_id=$1", [deal.id])).rows[0];
  if (!existing) await publishDeal(q, p, deal.id, false, true);
  return { ok: true };
}
export async function switchCallOffer(q: Queryable, p: Partner, id: string, value: unknown) {
  const service = textInput(value, "Offer", true, 20);
  if (!["fix", "tune", "care"].includes(service)) throw new Fault("Choose a standard catalog offer.");
  const d = await scopedDeal(q, p, id, true);
  if (!quotePaymentLink(d)) throw new Fault("Only an open standard quote can switch offers.");
  const l = shaped(await scopedLead(q, p, d.lead_id) as unknown as Record<string, unknown>);
  assertRecheck(l);
  if (await isOptedOut(q, l)) throw new Fault("This contact has opted out.");
  const page = (await q.query("select checkout_started_at,expires_at from team_deal_pages where deal_id=$1", [id])).rows[0];
  if (page?.checkout_started_at || (page && new Date(page.expires_at) <= new Date())) throw new Fault("Checkout has started or this link expired. Ask Blake to review a new quote.");
  const draft = quoteDraft([service]);
  await q.query("update team_deals set services=$1,price=$2,monthly=$3,scope=$4,approved=true,updated_at=now() where id=$5", [JSON.stringify(draft.services), draft.price, draft.monthly, draft.scope, id]);
  await prepareCall(q, p, l.id);
  return { ok: true };
}
export async function callState(
  q: Queryable,
  p: Partner,
  id?: string,
): Promise<CallState> {
  const row = id
    ? await visibleLead(q, p, id)
    : (
        await q.query(
          "select l.* from team_active_leads a join team_leads l on l.id=a.lead_id where a.partner_id=$1 and ($2::text is null or l.partner_id=$2)",
          [p.id, p.role === "owner" ? null : p.id],
        )
      ).rows[0];
  const empty = {
    lead: null,
    details: null,
    deal: null,
    page: null,
    problem: null,
    proof_available: false,
    script: "Open a lead on your computer, or choose one here.",
    commission: 0,
  };
  if (!row) return empty;
  if (!id) {
    try { await visibleLead(q, p, row.id); }
    catch (e) { if (e instanceof Fault && e.status === 404) return empty; throw e; }
  }
  const l = shaped(row as unknown as Record<string, unknown>);
  l.opted_out = await isOptedOut(q, l);
  const d = (
    await q.query(
      "select * from team_deals where lead_id=$1 and partner_id=$2 order by created_at desc,id limit 1",
      [l.id, l.partner_id],
    )
  ).rows[0] as Deal | undefined;
  const page = d
    ? (
        await q.query(
          "select code,opened_at,checkout_started_at,paid_at,expires_at,proof_reviewed_by from team_deal_pages where deal_id=$1",
          [d.id],
        )
      ).rows[0]
    : null;
  const details = (
    await q.query(
      "select cell,outcome,follow_up_at from team_call_details where lead_id=$1",
      [l.id],
    )
  ).rows[0] ?? { cell: "", outcome: null, follow_up_at: null };
  const findings = await leadFindings(q, l), proof = confirmedProof(findings),
    finding = confirmedFinding(findings), problem = finding?.measurement || finding?.detail || null;
  const earned = d
    ? (
        await q.query(
          "select coalesce(sum(p.amount),0)::int amount from team_payment_attributions a join crm_payments p on p.id=a.payment_id where a.deal_id=$1 and p.status='paid'",
          [d.id],
        )
      ).rows[0].amount
    : 0;
  // Do not ship embedded audit images/observations in the 2-second polling payload.
  const lead: TeamLead = {
    id: l.id,
    partner_id: l.partner_id,
    business: l.business,
    contact: l.contact,
    phone: l.phone,
    email: l.email,
    website: l.website,
    notes: l.notes,
    channel: l.channel,
    created_at: l.created_at,
    city: l.city,
    state: l.state,
    time_zone: l.time_zone,
    opted_out: l.opted_out,
    recheck: l.recheck ? {status:l.recheck.status,checked_at:l.recheck.checked_at,confirmed_count:l.recheck.confirmed_count} : undefined,
  };
  return {
    lead,
    details: details as CallState["details"],
    deal: d ?? null,
    page: (page ?? null) as CallState["page"],
    problem,
    plain_problem: finding ? plainFinding(finding) : null,
    say_it: finding ? sayFinding(finding) : null,
    impact:problem&&proof?impactLine(proof):null,
    verify_url:problem&&proof?verifyLink(proof):null,
    proof_available: Boolean(proof),
    script: finding && slowSeconds(finding) !== null ? slowSiteScript(slowSeconds(finding)!, p.name) : callScript(l, p.name, finding ? plainFinding(finding) : problem, Boolean(proof)),
    commission: Math.round(earned * 0.4),
  };
}
export async function saveCell(
  q: Queryable,
  p: Partner,
  id: string,
  value: unknown,
) {
  const l = await scopedLead(q, p, id);
  assertRecheck(l);
  if (await isOptedOut(q, l)) throw new Fault("This contact has opted out.");
  const raw = textInput(value, "Client cell", false, 80),
    cell = raw ? phoneNumber(raw) : "";
  if (cell === null) throw new Fault("Enter a valid US cell number.");
  await q.query(
    "insert into team_call_details(lead_id,cell) values($1,$2) on conflict(lead_id) do update set cell=excluded.cell,updated_at=now()",
    [id, cell],
  );
  return { ok: true };
}
export async function recordOutcome(
  q: Queryable,
  p: Partner,
  id: string,
  value: unknown,
) {
  const outcome = textInput(value, "Outcome", true, 30) as CallOutcome;
  if (!CALL_OUTCOMES.includes(outcome))
    throw new Fault("Choose a call outcome.");
  const l = await scopedLead(q, p, id);
  assertRecheck(l);
  if (await isOptedOut(q, l)) throw new Fault("This contact has opted out.");
  const deals = (
    await q.query(
      "select * from team_deals where lead_id=$1 and stage not in ('Client paid','Delivered','Lost') for update",
      [id],
    )
  ).rows as Deal[];
  if (outcome === "Closed" && (!deals.length || deals.some((d) => !d.approved)))
    throw new Fault("An approved quote is required before marking Closed.");
  const days = ["No answer", "Voicemail"].includes(outcome)
    ? 1
    : outcome === "Interested"
      ? 0
      : null;
  await q.query(
    `insert into team_call_details(lead_id,outcome,follow_up_at) values($1,$2,case when $3::int is null then null else now()+make_interval(days=>$3::int) end)
  on conflict(lead_id) do update set outcome=excluded.outcome,follow_up_at=excluded.follow_up_at,updated_at=now()`,
    [id, outcome, days],
  );
  await q.query(
    "insert into team_call_events(id,lead_id,actor_id,outcome) values($1,$2,$3,$4)",
    [randomUUID(), id, p.id, outcome],
  );
  await q.query(
    `update team_leads set data=jsonb_set(jsonb_set(data,'{notes}',to_jsonb(concat_ws(E'\n',nullif(data->>'notes',''),$2::text))),'{call_outcome}',to_jsonb($3::text)) where id=$1`,
    [id, `Call: ${outcome}`, outcome],
  );
  const stage =
    outcome === "Closed"
      ? "Won"
      : outcome === "Not interested"
        ? "Lost"
        : "Contacted";
  await q.query(
    `update team_deals set stage=case when $2 in ('Won','Lost') or stage='Lead' then $2 else stage end,lost_reason=case when $2='Lost' then 'Not interested' else lost_reason end,updated_at=now() where lead_id=$1 and stage not in ('Client paid','Delivered','Lost')`,
    [id, stage],
  );
  if (outcome === "Not interested")
    await q.query(
      "update team_payment_followups set resolved_at=now() where lead_id=$1 and resolved_at is null",
      [id],
    );
  return { ok: true };
}
async function snapshotProofMetadata(q: Queryable, leadId: string, code: string, proof: ProofFinding) {
  // Bind impact and verification to the exact reviewed public screenshot.
  const metadata={impact:impactLine(proof),verify_url:verifyLink(proof),proof_sha256:createHash('sha256').update(Buffer.from(proof.proof!.image.split(',')[1],'base64')).digest('hex')};
  await q.query("update team_leads set data=jsonb_set(data,'{deal_proof}',coalesce(data->'deal_proof','{}'::jsonb) || jsonb_build_object($2::text,$3::jsonb),true) where id=$1",[leadId,code,JSON.stringify(metadata)]);
}
export async function publishDeal(
  q: Queryable,
  p: Partner,
  id: string,
  proofReviewed = false,
  automatic = false,
) {
  if (!proofReviewed && !automatic)
    throw new Fault(
      "Review the screenshot for personal details before sharing.",
    );
  const d = await scopedDeal(q, p, id, true);
  if (!quotePaymentLink(d))
    throw new Fault(
      "Only an approved, unpaid catalog offer can have a deal page.",
    );
  const l = shaped(
    (await scopedLead(q, p, d.lead_id)) as unknown as Record<string, unknown>,
  );
  if (await isOptedOut(q, l)) throw new Fault("This contact has opted out.");
  assertRecheck(l);
  const proof = automatic ? confirmedFinding(await leadFindings(q, l)) : await leadProof(q, l);
  if (!proof)
    throw new Fault(
      "A confirmed auditor screenshot is required. Run a site check first.",
    );
  let problem = (proof.measurement || proof.detail)!.slice(0, 3000);
  for (const pii of [l.contact, l.email, l.phone].filter(Boolean))
    problem = problem.replaceAll(pii, "[private]");
  problem = problem.replace(
    /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g,
    "[private email]",
  );
  const existing = (
    await q.query(
      "select code,expires_at from team_deal_pages where deal_id=$1",
      [id],
    )
  ).rows[0];
  if (existing && new Date(existing.expires_at) > new Date()) {
    if (proofReviewed) {
      await q.query("update team_deal_pages set proof_image=$1,proof_at=$2,proof_reviewed_by=$3,problem=$4 where deal_id=$5", [proof.proof!.image, proof.proof!.captured_at, p.id, problem, id]);
      await snapshotProofMetadata(q,l.id,existing.code,proof);
    }
    return { code: existing.code };
  }
  // 10 characters ≈49 bits. CSPRNG + unique constraint; collision retries never overwrite another page.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = newDealCode();
    const r = await q.query(
      `insert into team_deal_pages(code,deal_id,problem,proof_image,proof_at,proof_reviewed_by) values($1,$2,$3,$4,$5,$6) on conflict do nothing returning code`,
      [code, id, problem, proofReviewed ? proof.proof!.image : "", proofReviewed ? proof.proof!.captured_at : new Date().toISOString(), proofReviewed ? p.id : null],
    );
    if (r.rows[0]) {
      if (proofReviewed) await snapshotProofMetadata(q,l.id,code,proof);
      return { code };
    }
    if (existing)
      throw new Fault(
        "This deal page expired. Ask Blake to review a new quote.",
      );
  }
  throw new Fault("Unable to create a unique link. Try again.", 503);
}
export async function publicDeal(q: Queryable, raw: string) {
  const code = normalizeCode(raw);
  if (!code) return null;
  const row = (
    await q.query(
      `select g.*,row_to_json(d) deal,row_to_json(l) lead from team_deal_pages g join team_deals d on d.id=g.deal_id join team_leads l on l.id=d.lead_id join team_partners p on p.id=d.partner_id where g.code=$1 and g.expires_at>now() and g.paid_at is null and p.active`,
      [code],
    )
  ).rows[0];
  if (!row || !quotePaymentLink(row.deal) || row.lead.data?.recheck?.status === "re-check failed" || (await isOptedOut(q, row.lead)))
    return null;
  const meta=row.lead.data?.deal_proof?.[row.code];
  const hash=typeof row.proof_image==='string'?createHash('sha256').update(Buffer.from(row.proof_image.split(',')[1]??'','base64')).digest('hex'):'';
  const matches=meta&&meta.proof_sha256===hash;
  row.impact=matches&&typeof meta.impact==='string'?meta.impact:null;
  row.verify_url=matches?verifyLink({url:row.lead.website,check:'Dead contact / booking / order link',verify_url:meta.verify_url}):null;
  const exact = confirmedLeverage(row.lead.data?.evidence).find(f => f.measurement === row.problem);
  row.plain_problem = plainFinding(exact ?? storedProblemFinding(row.problem));
  return row;
}
export async function markEngagement(
  q: Queryable,
  code: string,
  event: "opened" | "checkout",
) {
  const page = await publicDeal(q, code);
  if (page?.is_demo) return;
  if (!page) throw new Fault("This deal page is no longer available.", 410);
  const field = event === "opened" ? "opened_at" : "checkout_started_at";
  await q.query(
    `update team_deal_pages set ${field}=coalesce(${field},now()) where code=$1`,
    [page.code],
  );
  // A durable task exists immediately, becomes due after 2 hours, and is cleared by payment.
  // This works even when both browsers close; no paid scheduler or outbound send is involved.
  await q.query(
    `insert into team_payment_followups(deal_id,lead_id,due_at) values($1,$2,now()+interval '2 hours') on conflict(deal_id) do nothing`,
    [page.deal.id, page.lead.id],
  );
}
export async function paidCallDeal(q: Queryable, dealId: string) {
  if (
    !(await q.query("select to_regclass('public.team_deal_pages') present"))
      .rows[0]?.present
  )
    return;
  await q.query(
    "update team_deal_pages set paid_at=coalesce(paid_at,now()) where deal_id=$1",
    [dealId],
  );
  await q.query(
    "update team_payment_followups set resolved_at=now() where deal_id=$1 and resolved_at is null",
    [dealId],
  );
  await q.query(
    "update team_call_details set follow_up_at=null where lead_id=(select lead_id from team_deals where id=$1)",
    [dealId],
  );
  await q.query(
    "insert into team_owner_alerts(deal_id) values($1) on conflict do nothing",
    [dealId],
  );
}
export async function callInbox(q: Queryable, p: Partner) {
  const scope = p.role === "owner" ? null : p.id;
  const followups = (
    await q.query(
      `select f.deal_id,f.lead_id,l.business,f.due_at from team_payment_followups f join team_deals d on d.id=f.deal_id join team_leads l on l.id=f.lead_id where f.resolved_at is null and f.due_at<=now() and d.stage not in ('Lost','Client paid','Delivered') and ($1::text is null or d.partner_id=$1) order by f.due_at`,
      [scope],
    )
  ).rows;
  const alerts =
    p.role === "owner"
      ? (
          await q.query(
            "select a.*,l.business from team_owner_alerts a join team_deals d on d.id=a.deal_id join team_leads l on l.id=d.lead_id order by a.created_at desc limit 30",
          )
        ).rows
      : [];
  return { followups, alerts };
}
