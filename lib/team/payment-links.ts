import type { Deal } from "./types";

const offers = {
  fix: { path: "fix", price: 29900, monthly: 0 },
  tune: { path: "tune-up", price: 75000, monthly: 0 },
  care: { path: "care", price: 9900, monthly: 9900 },
} as const;
export function quotePaymentLink(deal: Deal): string | null {
  if (
    !deal.approved ||
    deal.services.length !== 1 ||
    ["Client paid", "Delivered", "Lost"].includes(deal.stage)
  )
    return null;
  const service = deal.services[0];
  if (!Object.hasOwn(offers, service)) return null;
  const offer = offers[service as keyof typeof offers];
  if (deal.price !== offer.price || deal.monthly !== offer.monthly) return null;
  if (
    ![deal.partner_id, deal.id].every((id) => /^[A-Za-z0-9_-]{1,80}$/.test(id))
  )
    return null;
  return `https://koinophobialabs.com/pay/${offer.path}?${new URLSearchParams({ partner: deal.partner_id, deal: deal.id })}`;
}
