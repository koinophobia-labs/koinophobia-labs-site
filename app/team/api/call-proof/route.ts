import { currentPartner } from "@/lib/team/session";
import { teamDatabase, hostedPreview } from "@/lib/team/db";
import { visibleLead, type TeamLead } from "@/lib/team/store";
import { leadProof } from "@/lib/team/call-store";
export async function GET(request: Request) {
  const p = await currentPartner();
  if (!p || hostedPreview()) return new Response(null, { status: 401 });
  try {
    const q = teamDatabase();
    const row = (await visibleLead(
      q,
      p,
      new URL(request.url).searchParams.get("lead") || "",
    )) as TeamLead & { data: object };
    const proof = await leadProof(q, { ...row.data, ...row });
    const match =
      /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(
        proof?.proof?.image || "",
      );
    if (!match) return new Response(null, { status: 404 });
    return new Response(Buffer.from(match[2], "base64"), {
      headers: {
        "Content-Type": match[1],
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
