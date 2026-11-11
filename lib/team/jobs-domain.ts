import { Fault } from "./domain";
export const platforms = [
  "Wix",
  "Squarespace",
  "WordPress",
  "Shopify",
  "GoDaddy",
  "Other",
  "Unknown",
] as const;
export type Platform = (typeof platforms)[number];
export const inviteSteps: Record<Platform, string[]> = {
  Wix: [
    "Open your site dashboard → Settings → Roles & Permissions.",
    "Choose Invite People and enter blake@koinophobialabs.com.",
    "Choose Website Manager (or the role needed for the agreed fix), then Send Invite.",
  ],
  Squarespace: [
    "Open your website dashboard → Settings → Permissions & Ownership.",
    "Choose Invite Contributor and enter blake@koinophobialabs.com.",
    "Grant Content Editor access for content changes, or Administrator if the agreed fix needs it. Send the invitation.",
  ],
  WordPress: [
    "WordPress.com: open Users → Add New User and choose Invite user. For self-hosted WordPress, open Users → Add New.",
    "Enter blake@koinophobialabs.com. Use an invitation or account setup link, never a password email.",
    "Choose Editor for content work, or Administrator only if the agreed fix needs settings/plugins. If your host only offers password sharing, choose Need help so Blake can arrange secure access.",
  ],
  Shopify: [
    "Open Settings → Users → Add users (where your plan supports users).",
    "Invite blake@koinophobialabs.com with Online store permissions for the agreed fix.",
    "If your plan requires a collaborator request, contact Blake to initiate it, then approve the request in Users. Never share your login.",
  ],
  GoDaddy: [
    "Open Account Settings → Delegate Access.",
    "Under People who can access my account, choose Invite to Access.",
    "Enter blake@koinophobialabs.com and choose Products & Domains access only as needed. Send the invitation.",
  ],
  Other: [
    "Find Users, Team, Permissions or Collaborators in your site dashboard.",
    "Invite blake@koinophobialabs.com with permissions for the agreed fix.",
    "If you cannot find an invitation option, select Need help below. Do not send a password.",
  ],
  Unknown: [
    "Choose Need help below. Blake will help identify your platform.",
    "Keep your login private. We will arrange contributor access together.",
  ],
};
export const validJobCode = (code: string) => /^[A-Za-z0-9_-]{43}$/.test(code);
export function deadlineFor(
  offer: string,
  paidAt: string | Date,
  quoted?: string | null,
) {
  const hours = offer === "fix" ? 72 : offer === "tune-up" ? 168 : null;
  if (hours)
    return new Date(new Date(paidAt).getTime() + hours * 3600000).toISOString();
  if (quoted && Number.isFinite(Date.parse(quoted)))
    return new Date(quoted).toISOString();
  return null;
}
export type JobFinding = {
  check: string;
  key: string;
  url: string;
  measurement: string;
  confidence: string;
  proof?: { image: string; captured_at: string };
  observations?: unknown[];
};
export type VerificationPass = {
  at: string;
  ok: boolean;
  reason: string;
  proofs: { url: string; image: string; captured_at: string }[];
};
export type Job = {
  id: string;
  payment_id: string;
  proposal_id: string;
  deal_id: string | null;
  partner_id: string | null;
  business: string;
  website: string;
  offer: string;
  stage: string;
  paid_at: string;
  deadline: string | null;
  access_since: string;
  code: string;
  code_expires_at: string;
  revision: number;
  verification: VerificationPass[];
  verification_due_at: string | null;
  data: {
    buyer_email?: string;
    findings: JobFinding[];
    platform?: Platform;
    contact?: string;
    cell?: string;
    contact_email?: string;
    access?: string;
    notes?: string;
    out_of_scope?: boolean;
    refund_draft?: { reason: string; created_at: string };
    refund_confirmed?: boolean;
    verification_error?: string;
  };
};
export function jobAlerts(j: Job, now = Date.now()) {
  if (["Delivered", "Closed"].includes(j.stage)) return [];
  const result: string[] = [];
  if (j.deadline) {
    const left = Date.parse(j.deadline) - now;
    if (left <= 0) result.push("overdue");
    else if (left <= 86400000) result.push("due-soon");
  } else result.push("quote-deadline");
  if (
    ["New", "Waiting on client access"].includes(j.stage) &&
    now - Date.parse(j.access_since) >= 86400000
  )
    result.push("access");
  if (
    j.data.out_of_scope ||
    (["New", "Waiting on client access"].includes(j.stage) &&
      now - Date.parse(j.access_since) >= 7 * 86400000)
  )
    result.push("refund-review");
  if (!j.data.findings?.length) result.push("proof-needed");
  return result;
}
export function deliveryReady(j: Job, now = Date.now()) {
  const [a, b] = j.verification;
  return (
    j.stage === "Verified" &&
    !!j.data.findings?.length &&
    !!a?.ok &&
    !!b?.ok &&
    a.proofs.length >= j.data.findings.length &&
    b.proofs.length >= j.data.findings.length &&
    Date.parse(b.at) - Date.parse(a.at) >= 600000 &&
    now - Date.parse(b.at) < 86400000
  );
}
export function onboardingInput(body: Record<string, unknown>) {
  if (Object.keys(body).some((k) => /password|secret|credential/i.test(k)))
    throw new Fault("Never send passwords. Invite us through your platform.");
  const value = (k: string, max: number, required = false) => {
    const v = typeof body[k] === "string" ? (body[k] as string).trim() : "";
    if (v.length > max || (required && !v))
      throw new Fault("Please check your contact details.");
    return v;
  };
  const platform = value("platform", 30) as Platform;
  if (!platforms.includes(platform)) throw new Fault("Choose your platform.");
  const contact = value("contact", 100, true),
    cell = value("cell", 30),
    contact_email = value("contact_email", 254);
  if (cell && !/^[+\d().\s-]{7,30}$/.test(cell))
    throw new Fault("Enter a valid cell number.");
  if (contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact_email))
    throw new Fault("Enter a valid email address.");
  const access = value("access", 30);
  if (!["Invite sent", "Need help"].includes(access))
    throw new Fault("Tell us whether you sent an invitation or need help.");
  return { platform, contact, cell, contact_email, access };
}
export function fixBrief(j: Job) {
  const entry: Record<Platform, string> = {
    Wix: "Wix Editor → select the affected element → Settings / Link",
    Squarespace: "Pages → Edit → select the affected block → Edit",
    WordPress:
      "Pages → select the affected page → Edit (or the responsible plugin settings)",
    Shopify: "Online Store → Themes → Customize → select the affected section",
    GoDaddy:
      "Websites + Marketing → Edit Website → select the affected section",
    Other: "Open the page editor and select the affected element",
    Unknown: "Identify the site platform with the client before making changes",
  };
  return [
    entry[j.data.platform || "Unknown"],
    ...j.data.findings.map(
      (f) =>
        `${f.check}: open ${f.url}. ${/link|form/i.test(f.check) ? "Select the affected button or form; replace the incorrect destination with the client-confirmed booking/contact URL." : /image/i.test(f.check) ? "Replace the missing image with the approved asset and update its path." : /mobile|tap|text/i.test(f.check) ? "Switch to mobile preview; correct widths, spacing and readable sizing on the affected elements." : /placeholder/i.test(f.check) ? "Replace the identified placeholder with approved business content." : /HTTPS|SSL/i.test(f.check) ? "Open hosting/domain security settings, renew or repair the certificate and replace insecure asset/form URLs." : /Slow|Lighthouse/i.test(f.check) ? "Measure the page, compress oversized images and remove unnecessary scripts; rerun the same mobile test." : "Use the proof to locate the exact failure and repair the responsible setting."}`,
    ),
    "Save/publish only the agreed fix. Check the exact URL on mobile and desktop.",
    "Mark Fix ready. The auditor must pass two checks at least 10 minutes apart before delivery.",
  ];
}

export const platformHelp: Partial<Record<Platform, string>> = {
  Wix: "https://support.wix.com/en/article/inviting-people-to-contribute-to-your-site",
  Squarespace:
    "https://support.squarespace.com/hc/en-us/articles/206537287-Invite-a-contributor",
  WordPress:
    "https://wordpress.com/support/invite-people/user-roles/",
  Shopify:
    "https://help.shopify.com/en/manual/your-account/users/security/collaborator-accounts",
  GoDaddy:
    "https://www.godaddy.com/help/invite-a-delegate-to-access-my-godaddy-account-12376",
};

export const alertLabels: Record<string,string> = {
 'due-soon':'Due within 24 hours',overdue:'Overdue',access:'Client access nudge',
 'quote-deadline':'Set the quoted deadline','refund-review':'Refund review available','proof-needed':'Confirmed proof needed',
};
export const offerLabel = (offer:string) => ({fix:'The Fix','tune-up':'Site Tune-Up',care:'Care Plan','new-site':'New Site','per-quote':'Quoted project'}[offer]||offer);
