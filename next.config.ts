import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      // /home is an internal rewrite target; keep one public URL per host.
      {
        source: "/home",
        has: [{ type: "host", value: "koinophobia.dev" }],
        destination: "https://koinophobia.dev/",
        permanent: false,
      },
      {
        source: "/home",
        has: [{ type: "host", value: "koinophobialabs.com" }],
        destination: "https://koinophobia.dev/",
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
          has: [{ type: "host", value: "koinophobia.dev" }],
          destination: "/home",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
