import type { MetadataRoute } from "next";
import { logEntries } from "@/lib/dev/log";
import { siteProducts } from "@/lib/products";
import { STUDIO_HOME_LAST_MODIFIED, STUDIO_URL } from "@/lib/seo";

const newestLogDate = [...logEntries].sort((a, b) => (a.date < b.date ? 1 : -1))[0]?.date ?? STUDIO_HOME_LAST_MODIFIED;

/**
 * One sitemap, one host. Product routes come from the registry so a product
 * cannot be listed without a page, and dates are the registry's verification
 * dates rather than build timestamps. /start and /crm are deliberately absent.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const fixed = [
    { path: "", lastModified: STUDIO_HOME_LAST_MODIFIED, priority: 1, changeFrequency: "weekly" as const },
    { path: "/shipped", lastModified: "2026-09-13", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/lab", lastModified: "2026-09-13", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/log", lastModified: newestLogDate, priority: 0.7, changeFrequency: "weekly" as const },
    { path: "/blake", lastModified: "2026-09-13", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/work-with-me", lastModified: "2026-09-13", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/resume", lastModified: "2026-09-10", priority: 0.4, changeFrequency: "monthly" as const },
    { path: "/privacy", lastModified: "2026-09-13", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/preaching-to-the-choir/privacy", lastModified: "2026-09-16", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/preaching-to-the-choir/support", lastModified: "2026-09-16", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/trendi/privacy", lastModified: "2026-08-31", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/trendi/support", lastModified: "2026-08-13", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/forget-about-it/privacy", lastModified: "2026-09-10", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/forget-about-it/support", lastModified: "2026-09-10", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/you-know-ball/play", lastModified: "2026-07-17", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/you-know-ball/privacy", lastModified: "2026-07-17", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/you-know-ball/support", lastModified: "2026-07-17", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/you-know-ball/safety", lastModified: "2026-07-17", priority: 0.3, changeFrequency: "yearly" as const },
  ];

  const products = siteProducts
    .filter((product) => product.href.startsWith("/"))
    .map((product) => ({
      path: product.href,
      lastModified: product.verifiedAt,
      priority: product.section === "shipped" ? 0.9 : 0.7,
      changeFrequency: "monthly" as const,
    }));

  return [...fixed, ...products].map(({ path, ...rest }) => ({ url: `${STUDIO_URL}${path}`, ...rest }));
}
