import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { intakeEntry, intakeHref } from "../lib/acquisition/entry";
import { validateIntake } from "../lib/acquisition/intake";
import { storeLead, listLeads } from "../lib/acquisition/leads";
import { validateQuickAdd } from "../lib/acquisition/quick-add";
import { deriveContentIdempotencyKey } from "../lib/acquisition/intake-abuse";
import { POST } from "../app/api/crm/leads/route";
import nextConfig from "../next.config";
import { createCrmSession, CRM_COOKIE } from "../lib/crm-auth";
function form(extra: Record<string,string> = {}) { const f = new FormData(); for (const [k,v] of Object.entries({ variant:"start", name:"Synthetic Person", email:"synthetic@example.com", biggestProblem:"Quotes wait too long for a reply", ...extra })) f.set(k,v); return f; }
const audit = { src:"chamber", offer:"audit", audience:"business", businessName:"Synthetic Business", role:"Owner", preferredContact:"email", budgetRange:"$250 audit" };
test("QR attribution survives hub, audit, intake, and arbitrary encoded sources", () => {
 for (const source of ["chamber", "North Side & Friends / October", "referral+partner"]) {
  const url = new URL(intakeHref(source, "audit"), "https://example.com");
  assert.equal(url.searchParams.get("src"), source); assert.equal(url.searchParams.get("offer"), "audit");
  assert.equal(intakeEntry(Object.fromEntries(url.searchParams)).business, true);
 }
 assert.equal(intakeEntry({src:["chamber","other"],offer:["audit","readiness"]}).offer,"audit");
 assert.equal(intakeEntry({src:"chamber",offer:"readiness"}).business,false);
 assert.equal(intakeEntry({}).business,false);
});
test("audit form validates contact and budget and preserves source and offer", () => {
 const parsed = validateIntake(form(audit)); assert.equal(parsed.errors,undefined);
 assert.equal(parsed.input?.source,"chamber"); assert.equal(parsed.input?.serviceInterest,"Revenue Leak Audit");
 assert.match(parsed.input!.notes!,/Offer: audit/); assert.match(parsed.input!.notes!,/Role: Owner/);
 assert.ok(validateIntake(form({...audit,preferredContact:"phone"})).errors?.phone);
 assert.ok(validateIntake(form({...audit,budgetRange:"$10"})).errors?.budgetRange);
 assert.ok(validateIntake(form({...audit,src:"x".repeat(161)})).errors?.src);
 assert.ok(validateIntake(form({...audit,businessName:""})).errors?.businessName);
 assert.equal(validateIntake(form({...audit,budgetRange:"Not sure yet",preferredContact:"text",phone:"555-0100"})).errors,undefined);
});
test("founder and readiness paths retain source without imposing business fields", () => {
 assert.equal(validateIntake(form()).input?.source,"start form");
 const p=validateIntake(form({src:"founder-referral",offer:"readiness"})); assert.equal(p.errors,undefined);
 assert.equal(p.input?.serviceInterest,"Straight Answer"); assert.equal(p.input?.source,"founder-referral");
 const custom=validateIntake(form({src:"event-anywhere",offer:"question"})); assert.match(custom.input!.notes!,/Offer: question/);
});
test("source and offer reach database columns and survive a read", async () => {
 const input=validateIntake(form(audit)).input!;
 const db={query:async(sql:string, v:unknown[])=>{ assert.match(sql,/insert into crm_leads/); assert.equal(v[2],"chamber"); assert.equal(v[9],"Revenue Leak Audit"); assert.match(String(v[13]),/Offer: audit/); return {rows:[{id:"synthetic-id",created_at:new Date(),updated_at:new Date(),source:v[2],service_interest:v[9],notes:v[13],created:true}]}; }};
 const saved=await storeLead(input,"synthetic-retry",db as never); assert.equal(saved.lead.source,"chamber"); assert.equal(saved.lead.serviceInterest,"Revenue Leak Audit");
});
test("different source or offer cannot silently deduplicate onto another inquiry", () => {
 const input=validateIntake(form(audit)).input!; const key=deriveContentIdempotencyKey(input,100);
 assert.notEqual(key,deriveContentIdempotencyKey({...input,source:"referral"},100));
 assert.notEqual(key,deriveContentIdempotencyKey({...input,serviceInterest:"Business inquiry"},100));
 assert.equal(key,deriveContentIdempotencyKey(input,100));
});
test("manual quick add accepts phone-only, defaults Chamber, and rejects bad fields", () => {
 const raw={name:"Synthetic Person",businessName:"Synthetic Company",phone:"555-0100",biggestProblem:"Follow-up",nextAction:"Arrange discovery",followUpAt:"2026-10-16T12:00:00-05:00",status:"meeting"};
 const p=validateQuickAdd(raw); assert.equal(p.errors,undefined); assert.equal(p.input?.source,"Chamber"); assert.equal(p.input?.email,""); assert.equal(p.update?.nextAction,"Arrange discovery");
 assert.ok(validateQuickAdd({...raw,phone:""}).errors); assert.ok(validateQuickAdd({...raw,status:"invalid"}).errors); assert.ok(validateQuickAdd({...raw,followUpAt:"invalid"}).errors);
 assert.equal(validateQuickAdd({...raw,status:"won"}).update?.outcome,"won");
});
test("CRM source and due filters bind source and use Chicago day boundaries", async () => {
 await listLeads({source:"Chamber' OR true --",due:"today"}, {query:async(sql:string,values:unknown[])=>{assert.match(sql,/lower\(source\) = lower\(\$1\)/);assert.match(sql,/America\/Chicago/);assert.match(sql,/status not in/);assert.deepEqual(values,["Chamber' OR true --"]);return {rows:[]};}} as never);
});
test("quick add rejects anonymous requests before writing", async () => { const result=await POST(new NextRequest("https://example.com/api/crm/leads",{method:"POST"}));assert.equal(result.status,401); });
test("canonical audit QR route is no longer redirected to the founder offer", async () => { const rules=await nextConfig.redirects!();assert.equal(rules.some(r=>r.source==="/audit"),false);assert.equal(rules.find(r=>r.source==="/revenue-leak-audit")?.destination,"/audit"); });

test("quick add rejects cross-site requests even with an administrator session", async () => {
 process.env.CRM_ADMIN_SECRET="synthetic-test-secret-with-enough-entropy";
 const req=new NextRequest("https://example.com/api/crm/leads",{method:"POST",headers:{cookie:`${CRM_COOKIE}=${createCrmSession()}`,origin:"https://outside.example","sec-fetch-site":"cross-site"}});
 assert.equal((await POST(req)).status,403);
});
