import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Koinophobia Labs",
    short_name: "Koinophobia",
    description:
      "AI products, creator systems, and founder-led software from Koinophobia Labs.",
    start_url: "/",
    display: "standalone",
    background_color: "#05060a",
    theme_color: "#9447ff",
    icons: [
      {
        src: "/brand/koi-emblem.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/brand/apple-icon",
        sizes: "256x256",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
