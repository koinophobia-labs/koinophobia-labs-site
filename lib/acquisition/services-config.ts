// D-0135: Blake/Director updates this remaining-slot count, then redeploys.
// Requests are reviewed manually; submitting does not reserve a slot.
export const STRAIGHT_ANSWER_FREE_SLOTS: number = 5;
export const freeStraightAnswerAvailable = (slots = STRAIGHT_ANSWER_FREE_SLOTS) => slots > 0;
export const offers = {
  revenue_leak_audit: { name: "Revenue Leak Audit", amount: 25000, path: "/audit", mode: "payment", timeline: "Written plan within 7 days of the call", terms: "$250 upfront", next: "Submit preferred call times after payment" },
  straight_answer: { name: "Straight Answer (Build Readiness Review)", amount: 25000, path: "/services/straight-answer", mode: "payment", timeline: "Review your PRD or spec", terms: "$250 upfront", next: "Send your PRD or spec link after payment" },
  monthly_support: { name: "Monthly support retainer", amount: 50000, path: "/services/retainer", mode: "subscription", timeline: "Monthly", terms: "$500/month for up to 5 hours. Unused hours do not roll over. Cancel anytime; ends at the period’s end.", next: "Send support details and access contacts after payment" },
} as const;
export type ServiceOffer = keyof typeof offers;
export type NewServiceOffer = Exclude<ServiceOffer, "revenue_leak_audit">;
export const serviceSessionCookie = (offer: ServiceOffer) => offer === "revenue_leak_audit" ? "audit_checkout_session" : `${offer}_checkout_session`;
