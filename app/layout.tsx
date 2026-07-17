import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono, Inter, JetBrains_Mono, Newsreader, Sora } from "next/font/google";
import BrandIntro from "@/components/brand/BrandIntro";
import "./globals.css";
import "./founder.css";
import "./founder-brand-refresh.css";
import "./founder-polish.css";
import "./ecosystem-pages-refresh.css";
import "./home.css";
import "./career-forge-home.css";
import "./you-know-ball-home-fix.css";
import "./trendi-feature.css";
import "./trendi-hero-visual.css";
import "./brand.css";

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

const socialImage = {
  url: "/brand/social-card",
  width: 1200,
  height: 630,
  alt: "Koinophobia Labs official logo with two cybernetic koi and a violet pulse",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://koinophobialabs.com"),
  title: "Koinophobia Labs — AI Products, Creator Systems, and Proof",
  description:
    "Koinophobia Labs is Blake Taylor’s product studio for AI tools, creator systems, sports debate products, and command-center interfaces. Built, tested, shipped.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/brand/koi-emblem.svg", type: "image/svg+xml" }],
    shortcut: ["/brand/koi-emblem.svg"],
    apple: [{ url: "/brand/apple-icon", type: "image/png", sizes: "256x256" }],
  },
  openGraph: {
    title: "Koinophobia Labs — AI Products, Creator Systems, and Proof",
    description:
      "Koinophobia Labs is Blake Taylor’s product studio for AI tools, creator systems, sports debate products, and command-center interfaces. Built, tested, shipped.",
    siteName: "Koinophobia Labs",
    type: "website",
    images: [socialImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "Koinophobia Labs — AI Products, Creator Systems, and Proof",
    description:
      "Koinophobia Labs is Blake Taylor’s product studio for AI tools, creator systems, sports debate products, and command-center interfaces. Built, tested, shipped.",
    images: ["/brand/social-card"],
  },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#080511",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${inter.variable} ${jetbrains.variable} ${archivo.variable} ${newsreader.variable} ${ibmPlexMono.variable}`}
    >
      <body>
        <BrandIntro />
        {children}
      </body>
    </html>
  );
}
