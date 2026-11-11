import { teamDatabase, hostedPreview } from "@/lib/team/db";
import { publicDeal } from "@/lib/team/call-store";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  if (hostedPreview()) return new Response(null, { status: 404 });
  const page = await publicDeal(teamDatabase(), (await params).code);
  if (!page) return new Response(null, { status: 404 });
  const match =
    /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(
      page.proof_image,
    );
  if (!match) return new Response(null, { status: 404 });
  return new Response(Buffer.from(match[2], "base64"), {
    headers: {
      "Content-Type": match[1],
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
