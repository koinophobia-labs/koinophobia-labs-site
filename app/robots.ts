import type { MetadataRoute } from "next";
import { STUDIO_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/crm/", "/api/", "/start"] },
    sitemap: `${STUDIO_URL}/sitemap.xml`,
    host: STUDIO_URL,
  };
}
