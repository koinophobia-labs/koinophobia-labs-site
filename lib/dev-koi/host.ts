/**
 * Where the personal koi is allowed to exist.
 *
 * Most personal routes are protected structurally — /products, /lab, /notes and
 * /about render through DevShell, which koinophobialabs.com never imports. But
 * /now and /connect are served by BOTH hosts from one app (koinophobia.dev is
 * canonical; the studio host answers them too, which predates this work). On
 * those two, structure alone would let a personal companion surface on the
 * commercial domain.
 *
 * So this is the second lock, and it is deliberately the inverse of the studio
 * companion's `companionHostAllowed`. The two allowlists are disjoint: no
 * hostname can satisfy both, so the two koi can never appear together.
 */
export function personalKoiHostAllowed(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === "koinophobia.dev" || host === "www.koinophobia.dev") return true;
  // Local development and preview builds of the personal site.
  if (host === "localhost" || host === "127.0.0.1") return true;
  return /^koinophobia-dev(?:-[a-z0-9-]+)?\.vercel\.app$/.test(host);
}
