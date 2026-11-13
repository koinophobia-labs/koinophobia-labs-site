import "./fonts.css";
// Preserved families: Hanken_Grotesk, Gelasio.

const body = { variable: "hanken_grotesk_9dc7382f-module__k3N8HW__variable" };
const display = { variable: "gelasio_8fd1deaf-module__tIb5ba__variable" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <><link rel="preload" as="font" type="font/woff2" crossOrigin="anonymous" href="/fonts/5a999aea4d5573dc-s.p.1c_k2hi1yi2cg.woff2" /><link rel="preload" as="font" type="font/woff2" crossOrigin="anonymous" href="/fonts/614a0f7b5f50b2dc-s.p.31liq74fp3j5t.woff2" /><link rel="preload" as="font" type="font/woff2" crossOrigin="anonymous" href="/fonts/c47649aa31f9e140-s.p.3lxpqujs87tck.woff2" /><div className={`${body.variable} ${display.variable}`}>{children}</div></>;
}
