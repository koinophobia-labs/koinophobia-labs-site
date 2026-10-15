// USA prices: WO-0127 INVENTORY §§1–7, ASC reads 2026-10-15.
// Keep amounts and billing terms here; UI, cards and structured data derive from these records.
export const appPrices = {
  trendi: [{ name: "Trendi Pro", amount: "7.99", term: "monthly", detail: "100 Coach Packs a month." }],
  "way-in": [
    { name: "Resume Toolkit", amount: "9.99", term: "one-time", detail: "One payment." },
    { name: "30-Day Career Pass", amount: "29.99", term: "30 days", detail: "Does not renew." },
  ],
  "forget-about-it": [
    { name: "Plus", amount: "2.99", term: "monthly", detail: "Date and source filters, capture patterns, and earlier reflections." },
    { name: "Plus", amount: "24.99", term: "yearly", detail: "The same Plus features, billed yearly." },
  ],
  "preaching-to-the-choir": [
    { name: "Keeper", amount: "2.99", term: "monthly", detail: "Similar wording in search, and a Year view." },
    { name: "Keeper", amount: "24.99", term: "yearly", detail: "The same Keeper features, billed yearly." },
    { name: "Keeper lifetime", amount: "79.00", term: "one-time", detail: "One payment for Keeper." },
  ],
  "old-dog": [{ name: "All courses", amount: "9.99", term: "one-time", detail: "All courses, including future subjects." }],
  "teachers-pet": [
    { name: "Family", amount: "34.99", term: "monthly", detail: "Family subscription." },
    { name: "Family", amount: "299.00", term: "yearly", detail: "Annual family subscription." },
    { name: "Family introductory offer", amount: "199.00", term: "first year", detail: "One year paid up front; then the standard yearly price. Eligibility applies." },
  ],
  dreamcatcher: [{ name: "Lucid Toolkit", amount: "9.99", term: "one-time", detail: "One payment." }],
} as const;
export type AppSlug = keyof typeof appPrices;
export const freePrice = { name: "Free to download", amount: "0.00" } as const;
export function priceLine(slug: AppSlug) {
  return `${freePrice.name} · ${appPrices[slug].map(p => `${p.name} $${p.amount} ${p.term}`).join(" · ")}`;
}
