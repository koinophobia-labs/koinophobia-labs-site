import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono, Inter, JetBrains_Mono, Newsreader, Sora } from "next/font/google";
import "./globals.css";
import "./founder.css";
import "./founder-editorial.css";
import "./ecosystem-pages-refresh.css";
import "./home.css";
import "./career-forge-home.css";
import "./you-know-ball-home-fix.css";
import "./trendi-feature.css";
import "./trendi-hero-visual.css";
import "./product-worlds.css";

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
  title: "Koinophobia Labs — AI Products, Creator Systems, and Proof",
  description:
    "Koinophobia Labs is Blake Taylor’s product studio for AI tools, creator systems, sports debate products, and command-center interfaces. Built, tested, shipped.",
  icons: {
    icon: "/koi-mark.png",
    apple: "/koi-mark.png",
  },
  openGraph: {
    title: "Koinophobia Labs — AI Products, Creator Systems, and Proof",
    description:
      "Koinophobia Labs is Blake Taylor’s product studio for AI tools, creator systems, sports debate products, and command-center interfaces. Built, tested, shipped.",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Koinophobia Labs — AI Products, Creator Systems, and Proof",
    description:
      "Koinophobia Labs is Blake Taylor’s product studio for AI tools, creator systems, sports debate products, and command-center interfaces. Built, tested, shipped.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sora.variable} ${inter.variable} ${jetbrains.variable} ${archivo.variable} ${newsreader.variable} ${ibmPlexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
