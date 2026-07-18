import { NextRequest, NextResponse } from "next/server";
import { type LeadInput, storeLead } from "@/lib/acquisition/leads";

const requiredFields = ["name", "businessName", "email", "websiteOrSocial", "industry", "serviceInterest", "timeline", "biggestProblem"] as const;
const fieldLimits: Record<string, number> = { name: 120, businessName: 160, email: 254, phone: 40, websiteOrSocial: 500, industry: 120, serviceInterest: 160, budgetRange: 80, timeline: 80, biggestProblem: 4000, notes: 8400 };
const rateLimit = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 5;

function value(form: FormData, key: string) { return String(form.get(key) || "").trim(); }
function validEmail(input: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input); }

export function validateIntake(form: FormData): { input?: LeadInput; errors?: Record<string, string> } {
  const desiredOutcome=value(form,"desiredOutcome"), currentTools=value(form,"currentTools"), additionalNotes=value(form,"notes");
  const input: LeadInput = {
    name: value(form, "name"), businessName: value(form, "businessName"), email: value(form, "email"),
    phone: value(form, "phone"), websiteOrSocial: value(form, "websiteOrSocial"), industry: value(form, "industry"),
    serviceInterest: value(form, "serviceInterest"), budgetRange: value(form, "budgetRange"), timeline: value(form, "timeline"),
    biggestProblem: value(form, "biggestProblem"),
    notes: [desiredOutcome ? `Desired outcome: ${desiredOutcome}` : "", currentTools ? `Current tools: ${currentTools}` : "", additionalNotes ? `Additional notes: ${additionalNotes}` : ""].filter(Boolean).join("\n\n"),
    source: "website intake",
  };
  const errors: Record<string, string> = {};
  for (const key of requiredFields) if (!input[key]) errors[key] = "This field is required.";
  if (desiredOutcome.length>2000) errors.desiredOutcome="Must be 2000 characters or fewer.";
  if (currentTools.length>2000) errors.currentTools="Must be 2000 characters or fewer.";
  if (additionalNotes.length>4000) errors.notes="Must be 4000 characters or fewer.";
  if (input.email && !validEmail(input.email)) errors.email = "Enter a valid email address.";
  for (const [key, limit] of Object.entries(fieldLimits)) {
    if (String(input[key as keyof LeadInput] || "").length > limit) errors[key] = `Must be ${limit} characters or fewer.`;
  }
  return Object.keys(errors).length ? { errors } : { input };
}

export function formatLeadEmailText(input: LeadInput) {
  return `New website audit lead\n\nName: ${input.name}\nBusiness name: ${input.businessName}\nEmail: ${input.email}\nPhone: ${input.phone || "Not provided"}\nWebsite/social: ${input.websiteOrSocial}\nIndustry: ${input.industry}\nService interest: ${input.serviceInterest}\nBudget range: ${input.budgetRange || "Not provided"}\nTimeline: ${input.timeline}\n\nBiggest problem:\n${input.biggestProblem}\n\nNotes:\n${input.notes || "Not provided"}\n\nSource: ${input.source || "website intake"}`;
}
function escapeHtml(v: string) { return v.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
export function formatLeadEmailHtml(input: LeadInput) {
  const rows = [["Name",input.name],["Business name",input.businessName],["Email",input.email],["Phone",input.phone||"Not provided"],["Website/social",input.websiteOrSocial],["Industry",input.industry],["Service interest",input.serviceInterest],["Budget range",input.budgetRange||"Not provided"],["Timeline",input.timeline],["Source",input.source||"website intake"]];
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#111827;line-height:1.5;margin:0;padding:24px"><h1 style="font-size:20px">New website audit lead</h1><table style="border-collapse:collapse;width:100%;max-width:720px"><tbody>${rows.map(([l,v])=>`<tr><th style="border:1px solid #e5e7eb;padding:8px;text-align:left;background:#f9fafb">${escapeHtml(l)}</th><td style="border:1px solid #e5e7eb;padding:8px">${escapeHtml(v)}</td></tr>`).join("")}</tbody></table><h2>Biggest problem</h2><p style="white-space:pre-wrap">${escapeHtml(input.biggestProblem)}</p><h2>Notes</h2><p style="white-space:pre-wrap">${escapeHtml(input.notes||"Not provided")}</p></body></html>`;
}
function mailto(input: LeadInput) { return `mailto:${process.env.CONTACT_TO_EMAIL || "koinophobia999@gmail.com"}?subject=${encodeURIComponent(`Koinophobia Labs intake: ${input.businessName}`)}&body=${encodeURIComponent(formatLeadEmailText(input))}`; }
export async function sendLeadEmail(input: LeadInput) {
  const apiKey=process.env.RESEND_API_KEY, to=process.env.CONTACT_TO_EMAIL, from=process.env.CONTACT_FROM_EMAIL||"Koinophobia Labs Leads <leads@koinophobialabs.com>";
  if (!apiKey || !to) return { ok:false, reason:"not_configured" as const };
  try {
    const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json"},body:JSON.stringify({from,to,subject:`New website audit lead: ${input.businessName}`,text:formatLeadEmailText(input),html:formatLeadEmailHtml(input),reply_to:input.email})});
    if (!response.ok) return { ok:false, reason:"provider_rejected" as const, status:response.status };
    const payload=await response.json().catch(()=>({}));
    return { ok:true, providerId:typeof payload.id === "string" ? payload.id : undefined };
  } catch { return { ok:false, reason:"provider_unreachable" as const }; }
}
function clientKey(request: NextRequest) { return (request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "unknown").trim(); }
export function checkRateLimit(key: string, now=Date.now()) {
  const existing=rateLimit.get(key); if (!existing || existing.resetAt<=now) { rateLimit.set(key,{count:1,resetAt:now+RATE_WINDOW_MS}); return false; }
  existing.count+=1; return existing.count>RATE_MAX;
}
function log(event:string, requestId:string, details:Record<string,unknown>={}) { console.info(JSON.stringify({scope:"intake",event,requestId,...details})); }

// A saved lead is a success even if the optional notification email fails or is
// unconfigured: the lead is already in the CRM, and telling the prospect to
// retry would create duplicates. Only an unsaved lead is a user-facing failure.
export function intakeOutcome(saved: boolean, emailSent: boolean) {
  if (!saved) return { ok: false as const, status: 503, message: "We could not safely record your intake right now. Please retry or use the email fallback." };
  return {
    ok: true as const,
    status: 200,
    emailSent,
    message: emailSent
      ? "Intake received and emailed to Blake. He will review fit, scope, and the next practical step."
      : "Intake received. Blake will review fit, scope, and the next practical step.",
  };
}
function failure(message:string,status:number,requestId:string,extra:Record<string,unknown>={}) { return NextResponse.json({ok:false,message,requestId,...extra},{status,headers:{"x-request-id":requestId}}); }

export async function POST(request: NextRequest) {
  const requestId=crypto.randomUUID();
  const suppliedIdempotencyKey=request.headers.get("idempotency-key")?.trim();
  const idempotencyKey=suppliedIdempotencyKey && suppliedIdempotencyKey.length<=200 ? suppliedIdempotencyKey : requestId;
  if (checkRateLimit(clientKey(request))) { log("rate_limited",requestId); return failure("Too many attempts. Please wait 10 minutes and try again.",429,requestId); }
  let form: FormData;
  try { form=await request.formData(); } catch { log("malformed_request",requestId); return failure("The submission format was invalid. Please refresh and try again.",400,requestId); }
  if (value(form,"companyWebsite")) { log("honeypot_rejected",requestId); return failure("The submission was rejected.",400,requestId); }
  const parsed=validateIntake(form);
  if (!parsed.input) { log("validation_failed",requestId,{fields:Object.keys(parsed.errors||{})}); return failure("Please correct the highlighted information and try again.",422,requestId,{errors:parsed.errors}); }
  const input=parsed.input;
  let saved=false, created=false;
  try { const result=await storeLead(input,idempotencyKey); saved=Boolean(result.lead); created=result.created; }
  catch { log("lead_storage_failed",requestId); }
  const delivery=await sendLeadEmail(input);
  const outcome=intakeOutcome(saved,delivery.ok);
  if (!outcome.ok) { log("persistence_failed",requestId,{providerAccepted:delivery.ok}); return failure(outcome.message,outcome.status,requestId,{mailto:mailto(input)}); }
  if (!delivery.ok) log("provider_failed",requestId,{reason:delivery.reason,status:"status" in delivery?delivery.status:undefined,saved});
  else log("accepted",requestId,{providerAccepted:true,providerId:delivery.providerId,saved,created});
  return NextResponse.json({ok:true,requestId,emailSent:outcome.emailSent,message:outcome.message},{headers:{"x-request-id":requestId}});
}
