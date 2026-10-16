import { Spectral, Instrument_Serif } from "next/font/google";

const body = Spectral({ subsets: ["latin"], variable: "--world-body", display: "swap", weight: ["400", "600"], });
const display = Instrument_Serif({ subsets: ["latin"], variable: "--world-display", display: "swap", weight: "400", style: ["normal", "italic"], });

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className={`${body.variable} ${display.variable}`}>{children}</div>;
}
