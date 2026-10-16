import { Instrument_Sans, EB_Garamond } from "next/font/google";

const body = Instrument_Sans({ subsets: ["latin"], variable: "--world-body", display: "swap",  });
const display = EB_Garamond({ subsets: ["latin"], variable: "--world-display", display: "swap",  });

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className={`${body.variable} ${display.variable}`}>{children}</div>;
}
