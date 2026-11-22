import "./fonts.css";
// Preserved families: Spectral, Instrument_Serif.

const body = { variable: "spectral_1ccdae8e-module__IR561q__variable" };
const display = { variable: "instrument_serif_534a78d1-module__JevIFG__variable" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <><link rel="preload" as="font" type="font/woff2" crossOrigin="anonymous" href="/fonts/7ebf22b5a21034f8-s.p.3j3877k49yy0l.woff2" /><link rel="preload" as="font" type="font/woff2" crossOrigin="anonymous" href="/fonts/98f992443ccb276f-s.p.1oxabuqlrz9-_.woff2" /><link rel="preload" as="font" type="font/woff2" crossOrigin="anonymous" href="/fonts/9d71b78498c53c0d-s.p.42kv-xe2onlt1.woff2" /><link rel="preload" as="font" type="font/woff2" crossOrigin="anonymous" href="/fonts/e41d5df559864f9e-s.p.1g73gv09-xcb6.woff2" /><div className={`${body.variable} ${display.variable}`}>{children}</div></>;
}
