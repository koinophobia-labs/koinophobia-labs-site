import { randomBytes, randomUUID } from "node:crypto";
import type { Queryable } from "../payments";
import type { Partner } from "./types";
import { owner, Fault, textInput } from "./domain";
import {
  validJobCode,
  deadlineFor,
  onboardingInput,
  deliveryReady,
  jobAlerts,
  type Job,
  type JobFinding,
  knownPlatform,
} from "./jobs-domain";

export const newJobCode = () => randomBytes(32).toString("base64url");
export async function createPaidJob(
  q: Queryable,
  paymentId: string,
  offer: string,
  buyerEmail: string,
  buyerName = "",
) {
  // Keep older payment test databases and staged additive rollout compatible.
  if (
    !(await q.query("select to_regclass('public.team_jobs') present")).rows[0]
      ?.present
  ) {
    if (process.env.VERCEL_ENV === "production")
      throw Error(
        "Fulfillment migration required before accepting paid events.",
      );
    return;
  }
  const r = (
    await q.query(
      `select p.*,l.name buyer_name,l.business_name,l.website_or_social,a.deal_id,d.partner_id,t.business,t.website,t.data lead_data,d.services,d.scope from crm_payments p join crm_leads l on l.id=p.lead_id left join team_payment_attributions a on a.payment_id=p.id left join team_deals d on d.id=a.deal_id left join team_leads t on t.id=d.lead_id where p.id=$1 and p.status='paid'`,
      [paymentId],
    )
  ).rows[0];
  if (!r) return;
  let findings: JobFinding[] =
    r.lead_data?.recheck?.status === "re-check failed"
      ? []
      : r.lead_data?.evidence || [];
  if (r.partner_id && r.website) {
    const urls=[r.website];
    try { const url=new URL(r.website);url.hash='';urls.push(url.href); } catch {}
    const latest = (
      await q.query(
        "select data from team_site_checks where partner_id=$1 and (data->>'url'=any($2::text[]) or data->>'final_url'=any($2::text[])) order by created_at desc limit 1",
        [r.partner_id, [...new Set(urls)]],
      )
    ).rows[0];
    if (latest) findings = latest.data.findings || [];
  }
  findings = findings.filter(
    (f) =>
      f.confidence === "confirmed" &&
      f.check &&
      f.key &&
      f.url &&
      f.proof?.image,
  );
  if (offer === "fix") {
    // The Fix purchases one problem, never every issue found on the site.
    const page =
      r.deal_id &&
      (
        await q.query(
          "select problem,proof_image from team_deal_pages where deal_id=$1",
          [r.deal_id],
        )
      ).rows[0];
    findings = page
      ? findings
          .filter(
            (f) =>
              f.proof?.image === page.proof_image ||
              f.measurement === page.problem,
          )
          .slice(0, 1)
      : findings.slice(0, 1);
  }
  const paidAt = r.paid_at || new Date(),
    id = randomUUID();
  const inserted = await q.query(
    `insert into team_jobs(id,payment_id,proposal_id,deal_id,partner_id,business,website,offer,paid_at,deadline,code,code_expires_at,data) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) on conflict do nothing returning id`,
    [
      id,
      paymentId,
      r.proposal_id,
      r.deal_id,
      r.partner_id,
      r.business || r.business_name || "Your website",
      r.website || r.website_or_social || "",
      offer || "per-quote",
      paidAt,
      deadlineFor(offer, paidAt),
      newJobCode(),
      new Date(new Date(paidAt).getTime() + 30 * 86400000),
      JSON.stringify({
        buyer_email: buyerEmail,
        contact: (buyerName || r.buyer_name || "").trim().slice(0, 100),
        platform: knownPlatform(r.lead_data?.platform),
        findings,
        scope: r.scope || "",
      }),
    ],
  );
  if (!inserted.rows[0]) return;
  await q.query("insert into team_job_events(job_id,kind) values($1,'New')", [
    id,
  ]);
  await q.query(
    "update team_jobs set stage='Waiting on client access' where id=$1",
    [id],
  );
  await q.query(
    "insert into team_job_events(job_id,kind) values($1,'Waiting on client access')",
    [id],
  );
  await q.query(
    "insert into team_job_messages(id,job_id,kind) values($1,$2,'next')",
    [`next:${id}`, id],
  );
}
export async function ownerJobs(q: Queryable, p: Partner) {
  owner(p);
  return (
    await q.query(
      "select * from team_jobs order by case when stage in ('Delivered','Closed') then 1 else 0 end, deadline asc nulls first,created_at desc",
    )
  ).rows as Job[];
}
export async function ownerJob(q: Queryable, p: Partner, id: string) {
  owner(p);
  const j = (
    await q.query("select * from team_jobs where id=$1 for update", [id])
  ).rows[0] as Job | undefined;
  if (!j) throw new Fault("Job not found.", 404);
  return j;
}
export async function publicJob(q: Queryable, code: string) {
  if (!validJobCode(code)) return null;
  return (
    ((
      await q.query(
        "select j.*,p.name partner_name from team_jobs j left join team_partners p on p.id=j.partner_id where j.code=$1 and j.code_expires_at>now() and j.stage<>'Closed'",
        [code],
      )
    ).rows[0] as Job | undefined) || null
  );
}
export async function saveOnboarding(
  q: Queryable,
  code: string,
  body: Record<string, unknown>,
) {
  const j = await publicJob(q, code);
  if (!j)
    throw new Fault(
      "This link has expired. Contact Blake for a new invitation.",
      410,
    );
  if (!["New", "Waiting on client access"].includes(j.stage))
    throw new Fault(
      "Access is already being handled. Contact Blake for changes.",
      409,
    );
  const input = onboardingInput(body);
  if (!j.website) {
    const website = textInput(body.website, "Website", true, 2000),
      business = textInput(body.business, "Business", true, 200);
    let url: URL;
    try {
      url = new URL(website);
    } catch {
      throw new Fault("Enter a full website address.");
    }
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      throw new Fault("Enter a public website without login details.");
    await q.query("update team_jobs set website=$2,business=$3 where id=$1", [
      j.id,
      url.href,
      business,
    ]);
  }
  await q.query(
    "update team_jobs set data=data||$2::jsonb,updated_at=now() where id=$1",
    [j.id, JSON.stringify(input)],
  );
  await q.query(
    "insert into team_job_events(job_id,kind) values($1,'Client onboarding received')",
    [j.id],
  );
  return { ok: true };
}
export async function jobAction(
  q: Queryable,
  p: Partner,
  id: string,
  body: Record<string, unknown>,
) {
  const j = await ownerJob(q, p, id),
    action = body.action;
  if (["Delivered", "Closed"].includes(j.stage))
    throw new Fault("This job is closed.", 409);
  let stage = j.stage;
  if (action === "notes")
    j.data.notes = textInput(body.notes, "Notes", false, 4000);
  else if (action === "deadline") {
    const date = textInput(body.deadline, "Quoted deadline", true, 60);
    if (!Number.isFinite(Date.parse(date)))
      throw new Fault("Enter the agreed quote deadline.");
    if (["fix", "tune-up"].includes(j.offer))
      throw new Fault("Paid catalog deadlines cannot be extended.");
    await q.query("update team_jobs set deadline=$2 where id=$1", [
      id,
      new Date(date),
    ]);
  } else if (action === "access") {
    if (!["New", "Waiting on client access"].includes(j.stage))
      throw new Fault("Access already confirmed.");
    j.data.access = "Confirmed by Blake";
    stage = "In progress";
  } else if (action === "attach-proof") {
    if (j.data.findings.length)
      throw new Fault("Purchased proof is preserved and cannot be replaced.");
    const check = (
      await q.query(
        "select data from team_site_checks where data->>'url'=$1 or data->>'final_url'=$1 order by created_at desc limit 1",
        [j.website],
      )
    ).rows[0];
    const findings = (check?.data.findings || []).filter(
      (f: JobFinding) =>
        f.confidence === "confirmed" &&
        f.check &&
        f.key &&
        f.url &&
        f.proof?.image,
    );
    if (!findings.length)
      throw new Fault(
        "Run Site Check on this exact website until the auditor confirms the problem twice, then attach it here.",
      );
    j.data.findings = j.offer === "fix" ? findings.slice(0, 1) : findings;
  } else if (action === "scope") {
    j.data.out_of_scope = true;
  } else if (action === "refund-draft") {
    if (!jobAlerts(j).includes("refund-review"))
      throw new Fault(
        "Refund review is available for no access after 7 days or out-of-scope work.",
      );
    j.data.refund_draft = {
      reason: j.data.out_of_scope ? "Out of scope" : "No access after 7 days",
      created_at: new Date().toISOString(),
    };
  } else if (action === "refund-confirm") {
    if (!j.data.refund_draft || body.confirm !== true)
      throw new Fault("Blake must explicitly confirm this draft.");
    j.data.refund_confirmed = true;
    stage =
      "Closed"; /* Draft authorization only. Stripe refund is a separate owner action. */
  } else if (action === "renew") {
    await q.query(
      "update team_jobs set code=$2,code_expires_at=now()+interval '30 days' where id=$1",
      [id, newJobCode()],
    );
  } else if (action === "fix-ready") {
    if (!["In progress", "Fix ready", "Verified"].includes(j.stage))
      throw new Fault("Confirm contributor access before starting the fix.");
    if (!j.data.findings.length)
      throw new Fault(
        "A confirmed auditor finding with screenshot proof is required.",
      );
    stage = "Fix ready";
    delete j.data.verification_error;
    await q.query(
      "update team_jobs set verification='[]',verification_due_at=now(),verification_lease=null,revision=revision+1 where id=$1",
      [id],
    );
  } else if (action === "deliver") {
    if (!deliveryReady(j))
      throw new Fault(
        "Delivery blocked: two fresh, successful checks with before/after proof are required.",
      );
    if (!j.data.buyer_email)
      throw new Fault("The purchase has no verified buyer email.");
    stage = "Delivered";
    if (j.deal_id)
      await q.query(
        "update team_deals set stage='Delivered',updated_at=now() where id=$1",
        [j.deal_id],
      );
    await q.query(
      "insert into team_job_messages(id,job_id,kind) values($1,$2,'fixed') on conflict do nothing",
      [`fixed:${id}`, id],
    );
  } else throw new Fault("Unknown job action.");
  await q.query(
    "update team_jobs set stage=$2,data=$3,updated_at=now() where id=$1",
    [id, stage, JSON.stringify(j.data)],
  );
  await q.query("insert into team_job_events(job_id,kind) values($1,$2)", [
    id,
    String(action),
  ]);
  return { ok: true };
}
export async function collectJobAlerts(q: Queryable) {
  const jobs = (
    await q.query(
      "select * from team_jobs where stage not in ('Delivered','Closed')",
    )
  ).rows as Job[];
  for (const j of jobs)
    for (const kind of jobAlerts(j).filter((k) =>
      ["due-soon", "overdue", "access"].includes(k),
    ))
      await q.query(
        "insert into team_job_messages(id,job_id,kind) values($1,$2,$3) on conflict do nothing",
        [
          `${kind}:${j.id}:${kind === "access" ? j.access_since : j.deadline}`,
          j.id,
          kind,
        ],
      );
  return jobs.length;
}
