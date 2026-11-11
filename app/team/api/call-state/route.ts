import { currentPartner } from "@/lib/team/session";
import { teamDatabase, hostedPreview } from "@/lib/team/db";
import { callState, callInbox } from "@/lib/team/call-store";
import { Fault } from "@/lib/team/domain";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const headers = {
    "Cache-Control": "private, no-store",
    "X-Robots-Tag": "noindex, nofollow",
  };
  try {
    const p = await currentPartner();
    if (!p)
      return Response.json(
        { error: "Please sign in." },
        { status: 401, headers },
      );
    if (hostedPreview())
      return Response.json(
        { error: "Read-only preview." },
        { status: 409, headers },
      );
    const id = new URL(request.url).searchParams.get("lead") || undefined;
    if (id && id.length > 80) throw new Fault("Invalid lead.", 400);
    const [state, inbox] = await Promise.all([
      callState(teamDatabase(), p, id),
      callInbox(teamDatabase(), p),
    ]);
    return Response.json({ ...state, ...inbox }, { headers });
  } catch (e) {
    return Response.json(
      { error: e instanceof Fault ? e.message : "Could not sync. Try again." },
      { status: e instanceof Fault ? e.status : 500, headers },
    );
  }
}
