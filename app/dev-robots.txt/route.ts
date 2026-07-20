// koinophobia.dev's own robots.txt.
//
// app/robots.ts hard-codes the studio host, so before this route
// koinophobia.dev/robots.txt told crawlers the canonical host was the *other*
// domain and pointed them at the studio sitemap. next.config.ts rewrites
// koinophobia.dev/robots.txt here.

export function GET() {
  const body = `User-Agent: *
Allow: /
Disallow: /crm/
Disallow: /api/
Disallow: /intake

Host: https://koinophobia.dev
Sitemap: https://koinophobia.dev/sitemap.xml
`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600",
    },
  });
}
