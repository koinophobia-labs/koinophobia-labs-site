import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { GET as auditPdf } from "../app/api/crm/audits/[id]/pdf/route";
import { assertPublicUrl } from "../lib/audit-engine";
import { validateAuditEdit, type AuditRecord } from "../lib/audits";
import { renderAuditPdf } from "../lib/audit-pdf";
import type { LeadRecord } from "../lib/acquisition/leads";
const finding = {
  id: "f1",
  category: "seo" as const,
  severity: "high" as const,
  title: "Missing description",
  evidence: "No meta description found.",
  recommendation: "Add a specific meta description.",
  measured: true,
  selectedForProposal: true,
};
test("protected audit PDF rejects unauthenticated requests", async () => {
  const response = await auditPdf(
    new NextRequest("https://example.com/api/crm/audits/a/pdf"),
    { params: Promise.resolve({ id: "a" }) },
  );
  assert.equal(response.status, 401);
});
test("SSRF guard rejects private and credentialed targets", async () => {
  await assert.rejects(() => assertPublicUrl("http://127.0.0.1"));
  await assert.rejects(() => assertPublicUrl("https://user:pass@example.com"));
  await assert.rejects(() => assertPublicUrl("file:///etc/passwd"));
});
test("audit edit validates enums and required evidence", () => {
  assert.ok(
    validateAuditEdit({
      summary: "Measured audit",
      findings: [finding],
      internalNotes: "",
    }).edit,
  );
  assert.ok(
    validateAuditEdit({
      summary: "Measured audit",
      findings: [{ ...finding, severity: "imaginary" }],
      internalNotes: "",
    }).errors,
  );
});
test("audit PDF renders multiple findings and excludes internal notes", async () => {
  const audit = {
      id: "12345678-0000-4000-8000-000000000001",
      leadId: "lead",
      status: "ready",
      targetUrl: "https://example.com",
      finalUrl: "https://example.com/",
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      summary: "Measured audit summary",
      findings: Array.from({ length: 24 }, (_, i) => ({
        ...finding,
        id: `f${i}`,
        title: `Measured finding ${i}`,
      })),
      metrics: {
        httpStatus: 200,
        https: true,
        responseMs: 123,
        htmlBytes: 4567,
        measurementNote: "Lighthouse and Core Web Vitals were not measured.",
      },
      pagesChecked: 1,
      linksChecked: 12,
      internalNotes: "SECRET_INTERNAL_NOTE",
      errorMessage: null,
    } satisfies AuditRecord,
    lead = { businessName: "Audit Test Co" } as LeadRecord;
  const pdf = await renderAuditPdf(audit, lead);
  assert.ok(pdf.length > 3000);
  assert.equal(pdf.includes(Buffer.from("SECRET_INTERNAL_NOTE")), false);
});
test("audit PDF excludes normalized findings hidden from clients",async()=>{const audit={id:"12345678-0000-4000-8000-000000000002",leadId:"lead",status:"completed",targetUrl:"https://example.com",finalUrl:"https://example.com",startedAt:new Date().toISOString(),completedAt:new Date().toISOString(),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),summary:"Client report",findings:[],metrics:{measurementNote:"Deterministic screening only."},pagesChecked:2,linksChecked:4,internalNotes:"PRIVATE_NOTE",errorMessage:null,scores:{overall:82,categories:{seo:{score:80,available:true},mobile:{score:null,available:false}}}} as AuditRecord,base={id:"visible",auditId:audit.id,category:"seo" as const,severity:"high" as const,title:"Visible finding",description:"Visible description",evidence:"VISIBLE_EVIDENCE",impact:"Visible impact",recommendation:"Visible recommendation",pageUrl:null,provenance:"measured" as const,clientVisible:true,selectedForProposal:true,sortOrder:0,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()},pdf=await renderAuditPdf(audit,{businessName:"PDF Filter Test"}as LeadRecord,[base,{...base,id:"hidden",title:"Hidden finding",evidence:"CLIENT_HIDDEN_SECRET",clientVisible:false}]);assert.ok(pdf.length>2000);assert.equal(pdf.includes(Buffer.from("CLIENT_HIDDEN_SECRET")),false)});
