/** URL attribution is visitor-supplied context, never an authorization signal. */
export type EntryQuery = { src?: string | string[]; offer?: string | string[]; audience?: string | string[] };
export function entryValue(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim() || "";
}
export function intakeEntry(query: EntryQuery) {
  const source = entryValue(query.src);
  const offer = entryValue(query.offer);
  return { source, offer, business: offer !== "readiness" && offer !== "app-store" && (offer === "audit" || entryValue(query.audience) === "business" || source.toLowerCase() === "chamber") };
}
export function intakeHref(source: string, offer = "", business = true) {
  const query = new URLSearchParams();
  if (source) query.set("src", source);
  if (offer) query.set("offer", offer);
  if (business) query.set("audience", "business");
  return `/start${query.size ? `?${query}` : ""}`;
}
