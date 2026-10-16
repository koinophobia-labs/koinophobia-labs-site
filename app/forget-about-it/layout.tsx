import { Instrument_Sans, Newsreader } from "next/font/google";

const body = Instrument_Sans({ subsets: ["latin"], variable: "--world-body", display: "swap",  });
const display = Newsreader({ subsets: ["latin"], variable: "--world-display", display: "swap", style: ["normal", "italic"], });

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className={`${body.variable} ${display.variable}`}>{children}</div>;
}
