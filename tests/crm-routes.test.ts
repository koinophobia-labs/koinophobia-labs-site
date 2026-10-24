import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { GET as listLeads } from "../app/api/crm/leads/route";
import { PATCH as updateLead } from "../app/api/crm/leads/[id]/route";
import { formatLeadEmailHtml, formatLeadEmailText, validateIntake } from "../lib/acquisition/intake";
import { intakeEntry } from "../lib/acquisition/entry";
import { redactLeadFreeText } from "../lib/acquisition/leads";

process.env.CRM_ADMIN_SECRET = "test-admin-secret-with-enough-entropy";

test("intake route validation accepts a complete CRM lead", () => {
  const form = new FormData();
  for (const [key, value] of Object.entries({ name:"Route Test", businessName:"Route Test Co", email:"route@example.com", websiteOrSocial:"https://example.com", industry:"Services", serviceInterest:"Website audit", timeline:"Soon", biggestProblem:"Conversions" })) form.set(key, value);
  const parsed = validateIntake(form);
  assert.equal(parsed.errors, undefined);
  assert.equal(parsed.input?.businessName, "Route Test Co");
});

function appStoreForm() {
  const form = new FormData();
  for (const [key, value] of Object.entries({
    variant: "start", offer: "app-store", src: "work-with-me", name: "App Founder", email: "founder@example.com",
    appName: "Sample Journal", biggestProblem: "A private journal for daily notes.", appStack: "SwiftUI with Claude and Codex",
    appPlatform: "iPhone", appStage: "Rejected", appRejection: "Review asks for clearer metadata.", developerAccount: "Yes",
    timeline: "By December", budgetRange: "$400–$600",
  })) form.set(key, value);
  return form;
}

test("App Store inquiries keep all launch details in the existing CRM and email payload", () => {
  const parsed = validateIntake(appStoreForm());
  assert.equal(parsed.errors, undefined);
  assert.ok(parsed.input);
  const input = redactLeadFreeText(parsed.input);
  assert.equal(input.businessName, "Sample Journal");
  assert.equal(input.serviceInterest, "App Store launch packages");
  assert.equal(input.source, "work-with-me");
  for (const body of [input.notes!, formatLeadEmailText(input), formatLeadEmailHtml(input)]) {
    for (const text of ["Sample Journal", "SwiftUI with Claude and Codex", "iPhone", "Rejected", "Review asks for clearer metadata.", "Yes"]) assert.ok(body.includes(text), `Missing ${text}`);
  }
  assert.equal(input.budgetRange, "$400–$600");
  assert.equal(input.timeline, "By December");
  assert.equal(intakeEntry({ offer: "app-store", audience: "business", src: "chamber" }).business, false);
});

test("App Store fields are bounded and validated server-side, while rejection text is optional", () => {
  const form = appStoreForm();
  form.delete("appRejection");
  assert.ok(validateIntake(form).input);
  form.set("appPlatform", "invented platform");
  form.set("appStage", "invented stage");
  form.set("developerAccount", "maybe");
  form.set("appStack", "x".repeat(301));
  form.set("appName", "");
  form.set("appRejection", "x".repeat(3001));
  form.set("budgetRange", "unlisted");
  const parsed = validateIntake(form);
  assert.equal(parsed.input, undefined);
  for (const key of ["appPlatform", "appStage", "developerAccount", "appStack", "appName", "appRejection", "budgetRange"]) assert.ok(parsed.errors?.[key], key);
});

test("App Review text receives the existing CRM redaction and email HTML escaping", () => {
  const form = appStoreForm();
  form.set("appRejection", "<script>bad()</script> token ghp_1234567890abcdef1234567890abcdefABCD");
  const input = validateIntake(form).input!;
  for (const body of [redactLeadFreeText(input).notes!, formatLeadEmailText(input), formatLeadEmailHtml(input)]) {
    assert.match(body, /\[redacted-api-key\]/);
    assert.doesNotMatch(body, /ghp_1234567890/);
  }
  assert.doesNotMatch(formatLeadEmailHtml(input), /<script>/);
  assert.match(formatLeadEmailHtml(input), /&lt;script&gt;/);
});

test("protected lead list rejects a request without a session", async () => {
  const response = await listLeads(new NextRequest("https://example.com/api/crm/leads"));
  assert.equal(response.status, 401);
});

test("protected update rejects a request without a session", async () => {
  const request = new NextRequest("https://example.com/api/crm/leads/lead-id", { method:"PATCH", body:JSON.stringify({ status:"contacted" }), headers:{ "content-type":"application/json" } });
  const response = await updateLead(request, { params:Promise.resolve({ id:"lead-id" }) });
  assert.equal(response.status, 401);
});
