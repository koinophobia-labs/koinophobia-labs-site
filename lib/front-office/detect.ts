/**
 * Host-neutral text detectors. Zero imports on purpose: both host policies
 * use these, and the personal policy must stay free of any commercial or
 * concierge dependency (the same isolation the two koi enforce).
 */

const MAX_INPUT = 4000;

/** First http(s)-able URL or bare domain in the text. */
export function detectUrl(text: string): string | undefined {
  const match = text.slice(0, MAX_INPUT).match(
    /\bhttps?:\/\/[^\s<>"']+|\b(?:[a-z0-9-]+\.)+(?:com|net|org|io|dev|co|shop|studio|app|us|biz)\b(?:\/[^\s<>"']*)?/i,
  );
  if (!match) return undefined;
  const candidate = match[0].replace(/[),.;!?]+$/, "");
  // Ignore obvious email domains captured without their local part.
  if (text.includes(`@${candidate}`)) return undefined;
  return candidate;
}

/** "my tattoo shop" → "Tattoo shop", "we run a gym" → "Gym". Requires an
 *  ownership phrase ending in a recognizable establishment noun. The noun may
 *  stand alone ("my gym") or carry a qualifier ("tattoo shop") — the audit
 *  found real visitors say both, and "we run…" is at least as common as
 *  "I run…". */
export function detectBusinessType(text: string): string | undefined {
  const match = text.slice(0, MAX_INPUT).match(
    /\b(?:my|our|for (?:my|our)|(?:i|we) (?:run|own|manage|have|opened)(?: a| an)?)\s+((?:[a-z][a-z\s-]{0,31}?\s)?(?:shop|studio|salon|gym|restaurant|cafe|café|bar|clinic|agency|firm|store|practice|bakery|barbershop|boutique|company|nonprofit|gallery))\b/i,
  );
  if (!match) return undefined;
  const captured = match[1]
    .replace(/\s+/g, " ")
    .replace(/^(?:small|little|big|new|local|own|growing)\s+/i, "")
    .trim();
  return captured.charAt(0).toUpperCase() + captured.slice(1).toLowerCase();
}
