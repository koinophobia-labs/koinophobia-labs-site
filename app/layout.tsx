import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Sora } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  metadataBase: new URL("https://koinophobia-labs.vercel.app"),
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
    <html lang="en" className={`${sora.variable} ${inter.variable} ${jetbrains.variable}`}>
      <body>{children}</body>
    </html>
  );
}
