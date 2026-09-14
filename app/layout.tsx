import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Newsreader, Sora } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import "./tokens.css";
import "./site.css";
import "./motion.css";
import "./founder.css";
import "./ecosystem-pages-refresh.css";
import "./home.css";
import "./career-forge-home.css";
import "./you-know-ball-home-fix.css";
import "./trendi-feature.css";
import "./trendi-hero-visual.css";
import "./brand.css";
import "./founder-editorial.css";
import "./product-worlds.css";
import "./commercial.css";
import "./koi-world.css";
import "./dev-system.css";
import "./dev-home.css";
import "./dev-product.css";
import "./dev-pages.css";
import "./dev-log.css";
import "./dev-koi.css";
import "./front-office.css";
import "./connect-card.css";
import "./resume-dev.css";
import "./now-dev.css";
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
const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["italic"],
  weight: ["400"],
});

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
      <body>
        <AnalyticsBridge />
        <Analytics />
        {children}
        <Motion />
      </body>
    </html>
  );
}
