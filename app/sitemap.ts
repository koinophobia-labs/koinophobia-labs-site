import type { MetadataRoute } from "next";
import { workProjects } from "@/lib/commercial";
import { STUDIO_HOME_LAST_MODIFIED, STUDIO_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  // /connect and /resume canonicalize to koinophobia.dev, so they are not listed here.
  const routes = [
    { path: "", lastModified: STUDIO_HOME_LAST_MODIFIED },
    { path: "/shipped", lastModified: "2026-09-13" },
    { path: "/lab", lastModified: "2026-09-13" },
    { path: "/lab/teachers-pet", lastModified: "2026-09-13" },
    { path: "/lab/koi", lastModified: "2026-09-13" },
    { path: "/lab/do-you-know-ball", lastModified: "2026-09-13" },
    { path: "/log", lastModified: "2026-09-13" },
    { path: "/blake", lastModified: "2026-09-13" },
    { path: "/work-with-me", lastModified: "2026-09-13" },
    { path: "/start", lastModified: "2026-09-13" },
    { path: "/services", lastModified: "2026-07-18" },
    { path: "/work", lastModified: "2026-08-13" },
    { path: "/products", lastModified: "2026-09-10" },
    { path: "/process", lastModified: "2026-08-13" },
    { path: "/about", lastModified: "2026-07-17" },
    { path: "/audit", lastModified: "2026-07-18" },
    { path: "/concierge", lastModified: "2026-07-21" },
    { path: "/trendi", lastModified: "2026-09-10" },
    { path: "/forget-about-it", lastModified: "2026-09-10" },
    { path: "/forget-about-it/support", lastModified: "2026-09-10" },
    { path: "/forget-about-it/privacy", lastModified: "2026-09-10" },
    { path: "/way-in", lastModified: "2026-09-10" },
    { path: "/trendi/privacy", lastModified: "2026-08-13" },
    { path: "/trendi/support", lastModified: "2026-08-13" },
    { path: "/you-know-ball/play", lastModified: "2026-07-17" },
  ];

  return [
    ...routes.map(({ path, lastModified }, index) => ({
      url: `${STUDIO_URL}${path}`,
      lastModified,
      changeFrequency: index === 0 ? ("weekly" as const) : ("monthly" as const),
      priority:
        index === 0
          ? 1
          : path === "/shipped" || path === "/work-with-me" || path === "/trendi" || path === "/forget-about-it" || path === "/way-in"
            ? 0.9
            : 0.7,
    })),
    ...workProjects.map((project) => ({
      url: `${STUDIO_URL}/work/${project.slug}`,
      lastModified: "2026-08-13",
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
  ];
}
