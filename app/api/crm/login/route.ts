import { NextRequest, NextResponse } from "next/server";
import { createCrmSession, CRM_COOKIE, validAdminSecret } from "@/lib/crm-auth";
export async function POST(request: NextRequest) {
  const form = await request.formData(); const candidate = String(form.get("secret") || "");
  if (!validAdminSecret(candidate)) return NextResponse.redirect(new URL("/crm/login?error=1", request.url), 303);
  const response = NextResponse.redirect(new URL("/crm", request.url), 303);
  response.cookies.set(CRM_COOKIE, createCrmSession(), { httpOnly:true, secure:process.env.NODE_ENV === "production", sameSite:"strict", path:"/", maxAge:43200 });
  return response;
}
