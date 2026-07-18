import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots { return { rules: { userAgent: "*", allow: "/", disallow: ["/crm/", "/api/", "/intake"] }, sitemap: "https://koinophobialabs.com/sitemap.xml", host: "https://koinophobialabs.com" }; }
