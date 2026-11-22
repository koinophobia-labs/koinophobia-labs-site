import { SERVICES, money } from "./config";
import type { Deal } from "./types";
export function quoteMessage(
  deal: Deal,
  business: string,
  name: string,
  format: string,
  link: string,
) {
  const services = deal.services
    .map((id) => SERVICES.find((s) => s.id === id)?.name)
    .join(" + ");
  const price =
    deal.price === null
      ? "Price pending Blake’s approval"
      : `${money(deal.price)}${deal.monthly ? ` initially, then ${money(deal.monthly)}/mo` : ""}`;
  const short = `Hi [name], here is the Koinophobia Labs quote for ${business}: ${services}, ${price}. ${link}\nInvoice follows on acceptance. Reply to confirm scope and schedule with Blake. — ${name}, partner with Koinophobia Labs`;
  if (format !== "Email") return short;
  return `Reply-To: blake@koinophobialabs.com\nSubject: Your Koinophobia Labs quote · ${business}\n\nHi [name],\n\nThanks for the conversation. Here is the proposed work:\n\n${deal.scope}\n\n${price}\n${deal.monthly ? "Includes the first Care Plan month; renewals are recorded separately.\n" : ""}\nReview the quote: ${link}\n\nInvoice follows on acceptance. Reply to confirm the scope and schedule with Blake.\n\n${name}\nPartner with Koinophobia Labs\nWe work remotely with businesses across the US.\nReply to blake@koinophobialabs.com\n[MAILING ADDRESS — Blake fills in]\nIf you prefer no further outreach, reply "no thanks" and we will stop.`;
}
