import "./fonts.css";
// Preserved families: Instrument_Sans, EB_Garamond.

const body = { variable: "instrument_sans_b2632be1-module__skqw7a__variable" };
const display = { variable: "eb_garamond_3c57a91a-module__2ldV5W__variable" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <><link rel="preload" as="font" type="font/woff2" crossOrigin="anonymous" href="/fonts/e4505858a30c79c2-s.p.0tlhhw_qyyfys.woff2" /><link rel="preload" as="font" type="font/woff2" crossOrigin="anonymous" href="/fonts/f06bf9da926bae75-s.p.2874ccu1_u7jf.woff2" /><div className={`${body.variable} ${display.variable}`}>{children}</div></>;
}
