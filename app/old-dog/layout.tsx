import "./fonts.css";
// Preserved families: Atkinson_Hyperlegible, Literata.

const body = { variable: "atkinson_hyperlegible_c03bb8af-module__eUshaa__variable" };
const display = { variable: "literata_92f97cea-module__oPESIq__variable" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <><link rel="preload" as="font" type="font/woff2" crossOrigin="anonymous" href="/fonts/30bdb5bb2b173ee1-s.p.0zb6_9j98fvm-.woff2" /><link rel="preload" as="font" type="font/woff2" crossOrigin="anonymous" href="/fonts/89ea96820aa96980-s.p.0hs6q6udzld4a.woff2" /><link rel="preload" as="font" type="font/woff2" crossOrigin="anonymous" href="/fonts/ed5f1f9bced69653-s.p.2li_3lqay9qjq.woff2" /><div className={`${body.variable} ${display.variable}`}>{children}</div></>;
}
