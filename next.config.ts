import type { NextConfig } from "next";

const DEV_HOST = "koinophobia.dev";
const LABS_HOST = "koinophobialabs.com";

/**
 * koinophobia.dev routes that live under /dev/* in the app tree.
 *
 * They need host-scoped rewrites because several of them (/products, /about)
 * collide with real studio pages of the same name. The studio keeps its page on
 * koinophobialabs.com; koinophobia.dev serves Blake's version from /dev/*.
 *
 * Each entry becomes a rewrite (public URL -> /dev source) and a redirect
 * (the /dev URL is never itself public — one canonical address per page).
 */
const DEV_ROUTES = ["/products", "/products/:slug", "/lab", "/notes", "/notes/:slug", "/about"];

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      // /home is an internal rewrite target; keep one public URL per host.
      {
        source: "/home",
        has: [{ type: "host", value: DEV_HOST }],
        destination: `https://${DEV_HOST}/`,
        permanent: false,
      },
      {
        source: "/home",
        has: [{ type: "host", value: LABS_HOST }],
        destination: `https://${DEV_HOST}/`,
        permanent: false,
      },
      // /dev/* is internal plumbing. On the personal host it collapses to the
      // clean URL; on the studio host it leaves for the personal host entirely.
      // Redirects run before beforeFiles rewrites, so this cannot loop — the
      // rewrite that follows is internal and never re-enters the redirect table.
      ...DEV_ROUTES.map((route) => ({
        source: `/dev${route}`,
        has: [{ type: "host" as const, value: DEV_HOST }],
        destination: `https://${DEV_HOST}${route}`,
        permanent: false,
      })),
      {
        source: "/dev/:path*",
        has: [{ type: "host", value: LABS_HOST }],
        destination: `https://${DEV_HOST}/:path*`,
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        // koinophobia.dev is Blake's personal home; koinophobialabs.com keeps
        // the studio homepage at the shared "/" route.
        {
          source: "/",
          has: [{ type: "host", value: DEV_HOST }],
          destination: "/home",
        },
        ...DEV_ROUTES.map((route) => ({
          source: route,
          has: [{ type: "host" as const, value: DEV_HOST }],
          destination: `/dev${route}`,
        })),
        // Crawler files are per-host. app/sitemap.ts and app/robots.ts are the
        // studio's; koinophobia.dev gets its own from dedicated route handlers.
        {
          source: "/sitemap.xml",
          has: [{ type: "host" as const, value: DEV_HOST }],
          destination: "/dev-sitemap.xml",
        },
        {
          source: "/robots.txt",
          has: [{ type: "host" as const, value: DEV_HOST }],
          destination: "/dev-robots.txt",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
