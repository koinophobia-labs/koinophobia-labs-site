import { Instrument_Sans, Source_Serif_4 } from "next/font/google";

const body = Instrument_Sans({ subsets: ["latin"], variable: "--world-body", display: "swap",  });
const display = Source_Serif_4({ subsets: ["latin"], variable: "--world-display", display: "swap",  });

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className={`${body.variable} ${display.variable}`}>{children}</div>;
}
