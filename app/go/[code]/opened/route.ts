import type { NextRequest } from "next/server";
import { transaction, hostedPreview } from "@/lib/team/db";
import { markEngagement } from "@/lib/team/call-store";
import { isTrustedMutationRequest } from "@/lib/security/origin";
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  if (!isTrustedMutationRequest(request) || hostedPreview())
    return new Response(null, { status: 403 });
  try {
    const { code } = await params;
    await transaction((q) => markEngagement(q, code, "opened"));
    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 410 });
  }
}
