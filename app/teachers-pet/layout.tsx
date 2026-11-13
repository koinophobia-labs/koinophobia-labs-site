import "./fonts.css";
// Preserved families: Lexend, Gelasio.

const body = { variable: "lexend_58c85cc7-module__QaaOgW__variable" };
const display = { variable: "gelasio_2a1653a2-module__ISHpYa__variable" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <><link rel="preload" as="font" type="font/woff2" crossOrigin="anonymous" href="/fonts/614a0f7b5f50b2dc-s.p.31liq74fp3j5t.woff2" /><link rel="preload" as="font" type="font/woff2" crossOrigin="anonymous" href="/fonts/ca31d6821328a4e9-s.p.2svk7cnw5x6df.woff2" /><div className={`${body.variable} ${display.variable}`}>{children}</div></>;
}
