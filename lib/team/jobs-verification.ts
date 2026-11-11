import {
  auditSite,
  blocked,
  type Audit,
  type AuditOptions,
} from "@koinophobia/site-auditor";
import type { Queryable } from "../payments";
import {
  type Job,
  type JobFinding,
  type VerificationPass,
} from "./jobs-domain";
export function resolvedFinding(f: JobFinding, a: Audit) {
  const p = a.home;
  if (
    !p ||
    p.error ||
    p.incomplete ||
    blocked(p) ||
    p.status !== 200 ||
    !p.proof?.image
  )
    return false;
  // A missing finding is not proof of health: require a supported measurement and
  // a fully rendered exact target. New checker types must add an explicit predicate.
  if (
    a.notes.some((n) =>
      /couldn.t verify|unavailable|robots|blocked|incomplete/i.test(
        n.name + " " + n.detail,
      ),
    )
  )
    return false;
  if (
    a.findings.some((x) => x.check === f.check) ||
    a.observations.some((x) => x.check === f.check)
  )
    return false;
  switch (f.check) {
    case "Dead contact / booking / order link":
    case "Closed Google Form":
      return (
        !!p.text.trim() &&
        !/form is no longer accepting|form has been deleted/i.test(p.text)
      );
    case "HTTPS failure":
      return p.url.startsWith("https:") && p.mixedBroken === 0;
    case "Mobile layout":
      return (
        p.screen === 390 &&
        p.width > 0 &&
        p.overflow <= 2 &&
        p.overlaps === 0 &&
        p.scale === 1
      );
    case "Slow page":
      return (
        a.samples.length >= 3 &&
        a.samples.every((s) => s.lcp !== null && s.load !== null) &&
        a.samples.every((s) => s.lcp! < 4000 && s.load! < 10000)
      );
    default:
      return false;
  }
}
export async function verifyJobPass(
  j: Job,
  run: (url: string, options: AuditOptions) => Promise<Audit> = auditSite,
): Promise<VerificationPass> {
  const proofs: VerificationPass["proofs"] = [];
  let options: AuditOptions = { includeHomeAsAction: true, maxLinks: 1 };
  if (process.env.VERCEL) {
    const chromium = (await import("@sparticuz/chromium")).default;
    options = {
      ...options,
      executablePath: await chromium.executablePath(),
      args: chromium.args,
    };
  }
  const results = new Map<string, Audit>();
  for (const f of j.data.findings) {
    const result = results.get(f.url) || (await run(f.url, options));
    results.set(f.url, result);
    if (!resolvedFinding(f, result))
      return {
        at: new Date().toISOString(),
        ok: false,
        reason:
          "The exact problem still reproduces, could not be measured, or requires a supported checker. Delivery is blocked.",
        proofs,
      };
    proofs.push({
      url: f.url,
      image: result.home!.proof!.image,
      captured_at: result.home!.proof!.captured_at,
    });
  }
  return {
    at: new Date().toISOString(),
    ok: j.data.findings.length > 0,
    reason: j.data.findings.length
      ? "Exact targets passed."
      : "No confirmed purchased problem is recorded.",
    proofs,
  };
}
export async function runJobVerification(
  q: Queryable,
  id?: string,
  run = verifyJobPass,
) {
  const j = (
    await q.query(
      `update team_jobs set verification_lease=now()+interval '10 minutes' where id=(select id from team_jobs where stage='Fix ready' and verification_due_at<=now() and (verification_lease is null or verification_lease<now()) and ($1::text is null or id=$1) order by verification_due_at limit 1 for update skip locked) returning *`,
      [id || null],
    )
  ).rows[0] as Job | undefined;
  if (!j) return;
  let pass: VerificationPass;
  try {
    pass = await run(j);
  } catch {
    pass = {
      at: new Date().toISOString(),
      ok: false,
      reason:
        "The auditor could not complete this check. Delivery is blocked. Retry Fix ready.",
      proofs: [],
    };
  }
  const passes = [...j.verification, pass],
    done = pass.ok && passes.length === 2;
  const stage = done ? "Verified" : "Fix ready";
  await q.query(
    `update team_jobs set verification=$2,stage=$3,verification_due_at=case when $4 then now()+interval '10 minutes' else null end,verification_lease=null,data=jsonb_set(data,'{verification_error}',to_jsonb($5::text)),updated_at=now() where id=$1 and revision=$6 and stage='Fix ready'`,
    [
      j.id,
      JSON.stringify(passes),
      stage,
      pass.ok && !done,
      pass.ok ? "" : pass.reason,
      j.revision,
    ],
  );
  await q.query(
    "insert into team_job_events(job_id,kind,detail) values($1,$2,$3)",
    [
      j.id,
      done
        ? "Verified"
        : pass.ok
          ? "First check passed"
          : "Verification blocked",
      pass.reason,
    ],
  );
}
