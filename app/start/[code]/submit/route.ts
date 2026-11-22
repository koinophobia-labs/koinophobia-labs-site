import type { NextRequest } from "next/server";
import { teamDatabase, transaction, hostedPreview } from "@/lib/team/db";
import { rateLimit } from "@/lib/team/auth";
import { saveOnboarding } from "@/lib/team/jobs-store";
import { Fault } from "@/lib/team/domain";
import { isTrustedMutationRequest } from "@/lib/security/origin";
export async function POST(
  r: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    if (hostedPreview()) throw new Fault("Preview is read-only.", 409);
    if (!isTrustedMutationRequest(r)) throw new Fault("Origin rejected.", 403);
    const { code } = await params;
    await rateLimit(teamDatabase(), "onboarding:" + code, 20);
    const raw = await r.text();
    if (raw.length > 4000) throw new Fault("Request too large.", 413);
    await transaction((q) => saveOnboarding(q, code, JSON.parse(raw)));
    return Response.json(
      { ok: true },
      {
        headers: {
          "Cache-Control": "no-store",
          "X-Robots-Tag": "noindex, nofollow",
        },
      },
    );
  } catch (e) {
    return Response.json(
      {
        error:
          e instanceof Fault
            ? e.message
            : "Unable to save. Please contact Blake.",
      },
      { status: e instanceof Fault ? e.status : 500 },
    );
  }
}
