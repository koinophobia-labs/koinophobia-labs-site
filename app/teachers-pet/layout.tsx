import { Lexend, Gelasio } from "next/font/google";

const body = Lexend({ subsets: ["latin"], variable: "--world-body", display: "swap",  });
const display = Gelasio({ subsets: ["latin"], variable: "--world-display", display: "swap", weight: ["400", "700"], });

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className={`${body.variable} ${display.variable}`}>{children}</div>;
}
