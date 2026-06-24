import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: "Koinophobia Labs - AI Products, Creator Systems, and Useful Tools",
  description:
    "Koinophobia Labs is a founder-led product and build studio for AI tools, creator systems, service websites, and practical workflow products.",
  openGraph: {
    title: "Koinophobia Labs",
    description:
      "Founder-led product lab building AI products, service websites, shipped tools, and practical workflow systems.",
    url: "https://koinophobia-labs.vercel.app",
    siteName: "Koinophobia Labs",
    type: "website"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>{children}</body>
    </html>
  );
}
