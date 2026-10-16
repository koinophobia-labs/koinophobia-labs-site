import { Hanken_Grotesk, Gelasio } from "next/font/google";

const body = Hanken_Grotesk({ subsets: ["latin"], variable: "--world-body", display: "swap", weight: ["400", "800"], });
const display = Gelasio({ subsets: ["latin"], variable: "--world-display", display: "swap", weight: ["400", "700"], style: ["normal", "italic"], });

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className={`${body.variable} ${display.variable}`}>{children}</div>;
}
