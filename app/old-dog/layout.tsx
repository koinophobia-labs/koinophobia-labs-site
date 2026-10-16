import { Atkinson_Hyperlegible, Literata } from "next/font/google";

const body = Atkinson_Hyperlegible({ subsets: ["latin"], variable: "--world-body", display: "swap", weight: ["400", "700"], });
const display = Literata({ subsets: ["latin"], variable: "--world-display", display: "swap",  });

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className={`${body.variable} ${display.variable}`}>{children}</div>;
}
