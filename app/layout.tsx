import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono, Inter, JetBrains_Mono, Newsreader, Sora } from "next/font/google";
import "./globals.css";
import "./founder.css";
import "./founder-brand-refresh.css";
import "./founder-polish.css";
import "./ecosystem-pages-refresh.css";
import "./home.css";
import "./you-know-ball-home-fix.css";
import "./trendi-feature.css";
import "./trendi-hero-visual.css";
import "./commercial.css";
import AnalyticsBridge from "@/components/studio/AnalyticsBridge";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"] });
const newsreader = Newsreader({ variable: "--font-newsreader", subsets: ["latin"] });
const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://koinophobialabs.com"),
  title: {
    default: "Koinophobia Labs | Websites, AI Workflows and Business Systems",
    template: "%s | Koinophobia Labs",
  },
  description:
    "Founder-led websites, AI workflows, booking systems, and conversion improvements for small businesses. Start with a practical Revenue Leak Audit.",
  icons: {
    icon: "/koi-mark.png",
    apple: "/koi-mark.png",
  },
  openGraph: {
    type: "website",
    siteName: "Koinophobia Labs",
    title: "Koinophobia Labs | Websites, AI Workflows and Business Systems",
    description:
      "Founder-led websites, AI workflows, booking systems, and conversion improvements for small businesses.",
    images: [{ url: "/og-commercial-1200.png", width: 1200, height: 630, alt: "Koinophobia Labs — websites, AI workflows, and business systems" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Koinophobia Labs | Websites, AI Workflows and Business Systems",
    description:
      "Founder-led websites, AI workflows, booking systems, and conversion improvements for small businesses.",
    images: ["/og-commercial-1200.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${sora.variable} ${inter.variable} ${jetbrains.variable} ${archivo.variable} ${newsreader.variable} ${ibmPlexMono.variable}`}>
      <body><AnalyticsBridge />{children}</body>
    </html>
  );
}
