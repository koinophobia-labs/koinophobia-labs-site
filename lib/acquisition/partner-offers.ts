export const partnerOffers = {
  fix: { name: "The Fix", amount: 29900, path: "/pay/fix", mode: "payment", timeline: "48–72 hours, scope confirmed by Blake", terms: "$299 one-time", next: "Blake will reach out within one business day to start", description: "One specific website problem: a broken booking or contact link, dead form, security warning or broken mobile layout." },
  "tune-up": { name: "Site Tune-Up", amount: 75000, path: "/pay/tune-up", mode: "payment", timeline: "Blake confirms after review", terms: "$750 one-time", next: "Blake will reach out within one business day to start", description: "Fix several website problems: forms, speed, mobile layout, broken links and SEO basics. Scope confirmed with Blake." },
  care: { name: "Care Plan", amount: 9900, path: "/pay/care", mode: "subscription", timeline: "Monthly", terms: "$99/month", next: "Blake will reach out within one business day to start", description: "Ongoing website monitoring, small fixes and a monthly check. Scope confirmed before work starts." },
} as const;
export type PartnerOffer = keyof typeof partnerOffers;
export const isPartnerOffer = (value: string): value is PartnerOffer => Object.hasOwn(partnerOffers, value);
export type PartnerAttribution = Partial<Record<"partner" | "deal" | "lead", string>>;

// Reject malformed references instead of silently changing their identity.
export function parsePartnerAttribution(params: URLSearchParams): PartnerAttribution | null {
  const result: PartnerAttribution = {};
  for (const [key, value] of params) {
    if (key !== "partner" && key !== "deal" && key !== "lead") return null;
    if (params.getAll(key).length !== 1 || !/^[A-Za-z0-9_-]{1,80}$/.test(value)) return null;
    result[key] = value;
  }
  return result;
}
export function partnerSearchParams(raw: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    for (const entry of Array.isArray(value) ? value : value === undefined ? [] : [value]) params.append(key, entry);
  }
  return params;
}
