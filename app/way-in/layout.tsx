import "./fonts.css";
// Preserved families: Instrument_Sans, Source_Serif_4.

const body = { variable: "instrument_sans_b2632be1-module__skqw7a__variable" };
const display = { variable: "source_serif_4_4d4514f4-module__0ePVba__variable" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <><link rel="preload" as="font" type="font/woff2" crossOrigin="anonymous" href="/fonts/68d403cf9f2c68c5-s.p.012bmydply3go.woff2" /><link rel="preload" as="font" type="font/woff2" crossOrigin="anonymous" href="/fonts/f06bf9da926bae75-s.p.2874ccu1_u7jf.woff2" /><div className={`${body.variable} ${display.variable}`}>{children}</div></>;
}
