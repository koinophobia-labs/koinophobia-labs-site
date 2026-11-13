import "./fonts.css";
// Preserved families: Instrument_Sans, Newsreader.

const body = { variable: "instrument_sans_b2632be1-module__skqw7a__variable" };
const display = { variable: "newsreader_9977eeeb-module__43tY1q__variable" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <><link rel="preload" as="font" type="font/woff2" crossOrigin="anonymous" href="/fonts/5f402bd2d8eef81a-s.p.40bho2kviej2o.woff2" /><link rel="preload" as="font" type="font/woff2" crossOrigin="anonymous" href="/fonts/8feca5bfbcc904f1-s.p.1xt3x57tcdmbv.woff2" /><link rel="preload" as="font" type="font/woff2" crossOrigin="anonymous" href="/fonts/9433d1a810498265-s.p.1hij5ex6k3v9q.woff2" /><link rel="preload" as="font" type="font/woff2" crossOrigin="anonymous" href="/fonts/f06bf9da926bae75-s.p.2874ccu1_u7jf.woff2" /><div className={`${body.variable} ${display.variable}`}>{children}</div></>;
}
