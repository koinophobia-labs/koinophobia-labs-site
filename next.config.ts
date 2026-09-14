import type { NextConfig } from "next";

const DEV_HOST = "koinophobia.dev";
const DEV_PREVIEW_HOST = "preview.koinophobia.dev";
const STUDIO = "https://koinophobialabs.com";

/**
 * One studio, one domain.
 *
 * koinophobia.dev used to serve Blake's personal site from /dev/* through
 * host-scoped rewrites. A one-person studio with two homes split its proof
 * in half, so every personal URL now redirects, permanently, to the page
 * that replaced it on koinophobialabs.com. The specific map comes first;
 * a catch-all sends anything unmapped to the same path on the studio host.
 */
const PERSONAL_TO_STUDIO: Array<[string, string]> = [
  ["/", "/"],
  ["/products", "/shipped"],
  ["/products/career-forge", "/way-in"],
  ["/products/trendi", "/trendi"],
  ["/products/forget-about-it", "/forget-about-it"],
  ["/products/you-know-ball", "/lab/do-you-know-ball"],
  ["/products/concierge", "/work-with-me"],
  ["/products/koi-cave", "/log"],
  ["/products/:slug", "/lab/:slug"],
  ["/log", "/log"],
  ["/lab", "/lab"],
  ["/notes", "/log"],
  ["/notes/:slug", "/log"],
  ["/now", "/log"],
  ["/about", "/blake"],
  ["/connect", "/blake"],
  ["/resume", "/resume"],
];

/**
 * Studio-host routes retired by the rebuild. The agency offer, the concept
 * builds, the concierge page, and the old intake all land on the page that
 * does their job now.
 */
const RETIRED_STUDIO_ROUTES: Array<[string, string]> = [
  ["/services", "/work-with-me"],
  ["/process", "/work-with-me"],
  ["/audit", "/work-with-me"],
  ["/revenue-leak-audit", "/work-with-me"],
  ["/concierge", "/work-with-me"],
  ["/intake", "/start"],
  ["/products", "/shipped"],
  ["/about", "/blake"],
  ["/work", "/shipped"],
  ["/work/:slug", "/shipped"],
  ["/demos/:slug", "/shipped"],
  ["/you-know-ball", "/lab/do-you-know-ball"],
  ["/home", "/"],
  ["/now", "/log"],
  ["/connect", "/blake"],
  ["/notes", "/log"],
  ["/notes/:slug", "/log"],
  ["/dev/:path*", "/"],
];

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      // The personal hosts leave for the studio host, permanently.
      ...[DEV_HOST, DEV_PREVIEW_HOST].flatMap((host) => [
        ...PERSONAL_TO_STUDIO.map(([source, destination]) => ({
          source,
          has: [{ type: "host" as const, value: host }],
          destination: `${STUDIO}${destination}`,
          permanent: true,
        })),
        {
          source: "/:path*",
          has: [{ type: "host" as const, value: host }],
          destination: `${STUDIO}/:path*`,
          permanent: true,
        },
      ]),
      // Retired studio routes.
      ...RETIRED_STUDIO_ROUTES.map(([source, destination]) => ({
        source,
        destination,
        permanent: true,
      })),
    ];
  },
};

export default nextConfig;
