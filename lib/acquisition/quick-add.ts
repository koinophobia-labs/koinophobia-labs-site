import { leadStatuses, type LeadInput, type LeadUpdate, type LeadStatus } from "./leads";
import { redactSecrets } from "@/lib/security/redaction";
export function validateQuickAdd(raw: unknown): { input?: LeadInput; update?: LeadUpdate; errors?: string[] } {
 if (!raw || typeof raw !== "object") return { errors: ["Invalid lead."] };
 const values = raw as Record<string, unknown>;
 const text = (key: string) => typeof values[key] === "string" ? (values[key] as string).trim() : "";
 const errors: string[] = [];
 const limits: Record<string, number> = { name: 120, businessName: 160, biggestProblem: 4000, nextAction: 1000, source: 160, notes: 4000, email: 254, phone: 40 };
 for (const [key, max] of Object.entries(limits)) if (text(key).length > max) errors.push(`${key} is too long.`);
 for (const key of ["name", "businessName", "biggestProblem", "nextAction"]) if (!text(key)) errors.push(`${key} is required.`);
 if (!text("email") && !text("phone")) errors.push("Enter an email or phone number.");
 if (text("email") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text("email"))) errors.push("Enter a valid email.");
 const status = text("status") || "new";
 if (!leadStatuses.includes(status as LeadStatus)) errors.push("Choose a valid stage.");
 const date = text("followUpAt");
 // The UI sends a local date converted to ISO, retaining the operator’s timezone.
 if (!date || Number.isNaN(Date.parse(date))) errors.push("Choose a follow-up date.");
 if (errors.length) return { errors };
 return { input: { name: text("name"), businessName: text("businessName"), email: text("email"), phone: text("phone"), biggestProblem: text("biggestProblem"), notes: text("notes"), source: text("source") || "Chamber", websiteOrSocial: "", industry: "Not given", serviceInterest: "Business inquiry", timeline: "Not discussed" }, update: { nextAction: redactSecrets(text("nextAction")), followUpAt: new Date(date).toISOString(), status: status as LeadStatus, outcome: status === "won" || status === "lost" ? status : "open" } };
}
