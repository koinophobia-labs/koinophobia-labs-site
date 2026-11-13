import type { Metadata, Viewport } from "next";
import "./fonts.css";
// Preserved families: JetBrains_Mono, Newsreader, Sora.
import PrivateAwareAnalytics from "@/components/team/PrivateAwareAnalytics";
import "./globals.css";
import "./tokens.css";
import "./site.css";
import "./business.css";
import "./motion.css";
import "./brand.css";
import "./koi-world.css";
import "./resume-dev.css";
import AnalyticsBridge from "@/components/studio/AnalyticsBridge";
import Motion from "@/components/motion/Motion";
import {
  STUDIO_DESCRIPTION,
  STUDIO_SOCIAL_IMAGE,
  STUDIO_TITLE,
  STUDIO_URL,
} from "@/lib/seo";

// Three families, each with one job: Sora is the studio voice, Newsreader
// italic is Blake's voice, JetBrains Mono is receipts. See the rebuild
// document, section 5.
const sora = { variable: "sora_b0747a85-module__uEWoma__variable" };

const jetbrains = { variable: "jetbrains_mono_d5b9deb1-module__d6n--G__variable" };

const newsreader = { variable: "newsreader_3d7cee65-module__ijG63a__variable" };

export const metadata: Metadata = {
  metadataBase: new URL(STUDIO_URL),
  title: {
    default: STUDIO_TITLE,
    template: "%s | Koinophobia Labs",
  },
  description: STUDIO_DESCRIPTION,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/brand/koi-emblem.svg", type: "image/svg+xml" }],
    shortcut: ["/brand/koi-emblem.svg"],
    apple: [
      { url: "/brand/apple-icon", type: "image/png", sizes: "256x256" },
    ],
  },
  openGraph: {
    type: "website",
    siteName: "Koinophobia Labs",
    url: STUDIO_URL,
    title: STUDIO_TITLE,
    description: STUDIO_DESCRIPTION,
    images: [STUDIO_SOCIAL_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: STUDIO_TITLE,
    description: STUDIO_DESCRIPTION,
    images: ["/brand/social-card"],
  },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#04060a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${sora.variable} ${jetbrains.variable} ${newsreader.variable}`}
    >
      <head><link rel="preload" as="font" type="font/woff2" crossOrigin="anonymous" href="/fonts/051742360c26797e-s.p.1bkzbscqrt8rl.woff2" /><link rel="preload" as="font" type="font/woff2" crossOrigin="anonymous" href="/fonts/6bd983bd58a87a3d-s.p.1hey5yyym6mz_.woff2" /><link rel="preload" as="font" type="font/woff2" crossOrigin="anonymous" href="/fonts/8feca5bfbcc904f1-s.p.1xt3x57tcdmbv.woff2" /></head>
      <body>
        <AnalyticsBridge />
        <PrivateAwareAnalytics />
        {children}
        <Motion />
      </body>
    </html>
  );
}
