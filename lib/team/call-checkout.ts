import type { Queryable } from "../payments";
import { teamDatabase, transaction } from "./db";
import { publicDeal, markEngagement } from "./call-store";
import { quotePaymentLink } from "./payment-links";
import { isOptedOut } from "./store";
import type { PartnerAttribution } from "../acquisition/partner-offers";
export async function resolveCallCheckout(
  offer: string,
  attribution: PartnerAttribution,
  code?: string | null,
  q: Queryable = teamDatabase(),
) {
  if (code) {
    const page = await publicDeal(q, code);
    if (
      !page ||
      page.is_demo ||
      page.deal.id !== attribution.deal ||
      page.deal.partner_id !== attribution.partner ||
      new URL(quotePaymentLink(page.deal)!).pathname !== `/pay/${offer}`
    )
      throw Error("DEAL_UNAVAILABLE");
    return { email: page.lead.email || "", code: page.code };
  }
  if (attribution.deal) {
    const row = (
      await q.query(
        "select row_to_json(d) deal,row_to_json(l) lead from team_deals d join team_leads l on l.id=d.lead_id where d.id=$1",
        [attribution.deal],
      )
    ).rows[0];
    if (
      row &&
      (!quotePaymentLink(row.deal) ||
        row.deal.partner_id !== attribution.partner ||
        new URL(quotePaymentLink(row.deal)!).pathname !== `/pay/${offer}` ||
        (await isOptedOut(q, row.lead)))
    )
      throw Error("DEAL_UNAVAILABLE");
    // Once a personal page exists its expiry applies to older /pay links too.
    if (row) {
      const page = (
        await q.query(
          "select code,is_demo from team_deal_pages where deal_id=$1",
          [attribution.deal],
        )
      ).rows[0];
      if (page && (page.is_demo || !(await publicDeal(q, page.code))))
        throw Error("DEAL_UNAVAILABLE");
      return { email: row.lead.email || "", code: page?.code };
    }
  }
  return { email: "", code: undefined };
}
export async function callCheckoutStarted(code: string) {
  await transaction((q) => markEngagement(q, code, "checkout"));
}
