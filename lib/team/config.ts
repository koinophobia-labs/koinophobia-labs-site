// Ported from Partner Desk. Blake owns the catalog and approves each deal.
export const TERMS = {
  commissionRate: 0.4,
  rateStatus: "CONFIRMED",
  // Blake, 2026-11-10 (D-0264): "client pay feels simpler"
  basis: "client payments received",
  basisStatus: "CONFIRMED",
  owedTrigger: "Verified Stripe payment received",
  owedStatus: "CONFIRMED",
  payoutTiming: "Blake approves and records each payout",
  payoutStatus: "PROPOSED",
  overridesEnabled: false,
  overrideRate: 0,
} as const;
export const SERVICES = [
  {
    id: "check",
    name: "Free Site Check",
    price: 0,
    cadence: "once",
    pitch: "Start with a specific, measured finding.",
    scope: "A short summary of the top 1–3 measured issues to review together.",
    turnaround: "5-minute review",
    tag: "START HERE",
  },
  {
    id: "fix",
    name: "The Fix",
    price: 29900,
    cadence: "once",
    pitch: "One problem. One clear fix.",
    scope:
      "Fix ONE specific high-impact problem: booking or contact form, mobile layout, page speed, or a dead order link.",
    turnaround: "48–72 hours, scope confirmed by Blake",
    tag: "FAST FIRST STEP",
  },
  {
    id: "tune",
    name: "Site Tune-Up",
    price: 75000,
    cadence: "once",
    pitch: "Get the essentials working together.",
    scope:
      "Audit + fix the top handful: forms, speed, mobile, broken links and SEO basics.",
    turnaround: "Blake confirms after review",
    tag: "IMPROVE",
  },
  {
    id: "site",
    name: "New Site",
    price: 250000,
    cadence: "from",
    pitch: "A fresh start, built for the phone.",
    scope:
      "Modern, fast, mobile-first website or rebuild. Final scope and price approved by Blake.",
    turnaround: "Blake confirms after review",
    tag: "REBUILD",
  },
  {
    id: "care",
    name: "Care Plan",
    price: 9900,
    cadence: "monthly",
    pitch: "Keep the small things from piling up.",
    scope:
      "Monitoring, small fixes and a monthly check. Scope confirmed before work starts.",
    turnaround: "Monthly",
    tag: "KEEP IT HEALTHY",
  },
  {
    id: "app",
    name: "Custom App Build",
    price: null,
    cadence: "custom",
    pitch: "You have the spec. We help get it to release.",
    scope:
      "PRD → Release: architecture, implementation, QA, design integration and release prep. Start with a Straight Answer review.",
    turnaround: "Quote per project, fixed-price milestones Blake approves",
    tag: "CLIENT STUDIO",
  },
  {
    id: "ai",
    name: "AI Automation",
    price: null,
    cadence: "custom",
    pitch: "Turn a repetitive workflow into a scoped build.",
    scope:
      "Review the workflow, agree the automation scope and deliver against approved milestones.",
    turnaround: "Quote per project, fixed-price milestones Blake approves",
    tag: "CUSTOM WORK",
  },
] as const;
export const money = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: cents % 100 ? 2 : 0,
  }).format(cents / 100);
export const servicePrice = (s: (typeof SERVICES)[number]) =>
  s.price === null
    ? "Request a quote"
    : s.price === 0
      ? "Free"
      : `${s.cadence === "from" ? "From " : ""}${money(s.price)}${s.cadence === "monthly" ? "/mo" : ""}`;
