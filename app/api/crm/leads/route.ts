import { createManualLead } from "@/lib/acquisition/leads";
import { validateQuickAdd } from "@/lib/acquisition/quick-add";
import { isTrustedMutationRequest } from "@/lib/security/origin";
import { NextRequest, NextResponse } from "next/server"; import { isCrmApiAuthorized } from "@/lib/crm-access"; import { listLeads } from "@/lib/acquisition/leads";
export async function GET(request: NextRequest) {
  if (!(await isCrmApiAuthorized(request))) return NextResponse.json({ok:false},{status:401});
  const p=request.nextUrl.searchParams; return NextResponse.json({ok:true,leads:await listLeads({search:p.get("search")||undefined,status:p.get("status")||undefined,sort:p.get("sort")||undefined,source:p.get("source")||undefined,due:p.get("due")||undefined,abandoned:p.get("abandoned")||undefined})});
}

export async function POST(request: NextRequest) {
  if (!(await isCrmApiAuthorized(request))) return NextResponse.json({ ok: false }, { status: 401 });
  if (!isTrustedMutationRequest(request)) return NextResponse.json({ ok: false }, { status: 403 });
  const parsed = validateQuickAdd(await request.json().catch(() => null));
  if (!parsed.input || !parsed.update) return NextResponse.json({ ok: false, errors: parsed.errors }, { status: 422 });
  const key = request.headers.get("idempotency-key") || "";
  if (!/^[a-zA-Z0-9-]{16,100}$/.test(key)) return NextResponse.json({ ok: false, errors: ["Refresh the form and retry."] }, { status: 422 });
  try {
    const lead = await createManualLead(parsed.input, parsed.update, key);
    return NextResponse.json({ ok: true, id: lead?.id }, { status: 201, headers: { "cache-control": "no-store" } });
  } catch { return NextResponse.json({ ok: false, errors: ["Could not save. Check database availability and migration 009, then retry."] }, { status: 503 }); }
}
