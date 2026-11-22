import type { NextRequest } from "next/server";
import { currentPartner } from "@/lib/team/session";
import { teamDatabase, transaction, hostedPreview } from "@/lib/team/db";
import { owner, Fault } from "@/lib/team/domain";
import { rateLimit } from "@/lib/team/auth";
import { jobAction } from "@/lib/team/jobs-store";
import { runJobVerification } from "@/lib/team/jobs-verification";
import { drainJobMail } from "@/lib/team/jobs-mail";
import { isTrustedMutationRequest } from "@/lib/security/origin";
export const maxDuration = 300;
export async function POST(r: NextRequest) {
  try {
    if (!isTrustedMutationRequest(r)) throw new Fault("Origin rejected.", 403);
    if (hostedPreview()) throw new Fault("Preview is read-only.", 409);
    const p = await currentPartner();
    if (!p) throw new Fault("Sign in.", 401);
    owner(p);
    await rateLimit(teamDatabase(), "jobs:" + p.id, 30);
    const raw = await r.text();
    if (raw.length > 8000) throw new Fault("Request too large.", 413);
    const b = JSON.parse(raw);
    if (typeof b.id !== "string") throw new Fault("Job required.");
    const result = await transaction((q) => jobAction(q, p, b.id, b));
    if (b.action === "fix-ready")
      await runJobVerification(teamDatabase(), b.id);
    if (b.action === "deliver") await drainJobMail(teamDatabase());
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return Response.json(
      { error: e instanceof Fault ? e.message : "Unable to update this job." },
      { status: e instanceof Fault ? e.status : 500 },
    );
  }
}
