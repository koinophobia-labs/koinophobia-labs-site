import { logEntries, logKindLabel } from "@/lib/dev/log";
import { getProduct } from "@/lib/dev/universe";
import { STUDIO_URL } from "@/lib/seo";

// RSS for the build log. The log has no newsletter capture on purpose; this
// is how people follow it.

const escape = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

const surfaceName = (slug: string) =>
  slug === "site" ? "This site" : slug === "studio" ? "The studio" : (getProduct(slug)?.name ?? slug);

export function GET() {
  const entries = [...logEntries].sort((a, b) => b.date.localeCompare(a.date));
  const items = entries
    .map((entry) => {
      const link = `${STUDIO_URL}/log#${entry.slug}`;
      const body = [entry.what, `Why: ${entry.why}`, `Next: ${entry.next}`].join("\n\n");
      return `    <item>
      <title>${escape(entry.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${new Date(`${entry.date}T12:00:00Z`).toUTCString()}</pubDate>
      <category>${escape(surfaceName(entry.product))} · ${escape(logKindLabel[entry.kind])}</category>
      <description>${escape(body)}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Koinophobia Labs · Build log</title>
    <link>${STUDIO_URL}/log</link>
    <atom:link href="${STUDIO_URL}/log/feed.xml" rel="self" type="application/rss+xml" />
    <description>What actually happened across the studio's products, dated and sourced.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date(`${entries[0]?.date ?? "2026-09-13"}T12:00:00Z`).toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
