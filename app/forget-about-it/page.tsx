import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AppStoreLink, ProductPageView } from "@/components/products/ProductAnalytics";
import ProductVideo from "@/components/products/ProductVideo";
import { forgetRelease } from "@/lib/releases";
import "../released-app.css";

export const metadata: Metadata = {
  title: "Forget About It | Before you forget",
  description: "Capture a thought on iPhone or Apple Watch and return to a readable record of your day. A private, offline memory journal. Free on the App Store.",
  alternates: { canonical: "https://koinophobialabs.com/forget-about-it" },
  openGraph: { url: "/forget-about-it", images: ["/forget-about-it/store/1.jpg"] },
};

export default function ForgetAboutItPage() {
  return <main className="releasedApp releasedApp--memory">
    <ProductPageView product="forget-about-it" />
    <nav className="releasedApp__nav" aria-label="Forget About It navigation">
      <Link href="/"><Image src="/brand/koinophobia-labs-koi-640.webp" alt="" width={32} height={32} /> Koinophobia Labs</Link>
      <div><Link href="/products">Products</Link><Link href="/forget-about-it/support">Support</Link><Link href="/forget-about-it/privacy">Privacy</Link></div>
    </nav>
    <section className="releasedApp__hero">
      <div><p className="releasedApp__eyebrow">Forget About It · iPhone + Apple Watch</p>
        <h1>Keep the thought.<br />Come back to your day.</h1>
        <p className="releasedApp__lede">The thing you meant to remember disappears between the train, the meeting, and getting home. Say it or type it before it slips away. Forget About It keeps your exact words and brings the fragments together into a day you can read back.</p>
        <AppStoreLink product="forget-about-it" placement="hero" className="releasedApp__button" href={forgetRelease.url} />
        <p className="releasedApp__note">Free · No account · Works offline</p>
        <a className="releasedApp__textLink" href="#inside-the-app">See the actual app ↓</a>
      </div>
      <ProductVideo />
    </section>
    <section className="releasedApp__section" id="inside-the-app">
      <p className="releasedApp__eyebrow">Inside Forget About It</p><h2>Your words, kept in order.</h2>
      <p>Authentic screenshots from the current App Store listing.</p>
      <div className="releasedApp__screens">
        {[[1, "Today: your captures and a reading of the day"], [3, "History: revisit the days you captured"], [4, "Memory: find the people and subjects you return to"]].map(([n, alt]) => <figure key={n}><Image src={`/forget-about-it/store/${n}.jpg`} alt={String(alt)} width={600} height={1304} sizes="(max-width: 700px) 85vw, 30vw" /><figcaption>{alt}</figcaption></figure>)}
      </div>
    </section>
    <section className="releasedApp__section releasedApp__features" aria-label="How Forget About It works">
      <article><span>01</span><h2>Capture in the moment</h2><p>Type or dictate on iPhone. On Apple Watch, speak, scribble, or type. Watch captures save locally and queue for transfer when your iPhone reconnects.</p></article>
      <article><span>02</span><h2>Read the day back</h2><p>See your thoughts in order, a short account grounded in your captures, recurring names and subjects, and things you said you would return to. Your original words remain separate from the app’s interpretation.</p></article>
      <article><span>03</span><h2>Keep it on your devices</h2><p>The app has no account, analytics, or servers. Your journal is excluded from backups; save your own copy from Settings. An optional evening reminder never displays your writing.</p></article>
    </section>
    <section className="releasedApp__section releasedApp__details" aria-labelledby="devices-title">
      <div><h2 id="devices-title">Bring your iPhone. Capture from your wrist.</h2><p>iPhone requires iOS 17.0 or later. The companion Apple Watch app requires watchOS 10.0 or later.</p><p>Apple also lists compatibility with macOS 14.0 or later on an Apple M1 Mac or newer, and visionOS 1.0 or later. The core capture-and-sync experience is built around iPhone and Apple Watch.</p></div>
      <div><h2>Free to download</h2><p>Version {forgetRelease.version} is publicly available. No subscription or in-app purchase is listed. Availability and device compatibility can be checked on the <a href={forgetRelease.url}>App Store</a>.</p><p className="releasedApp__note">Listing checked September 10, 2026.</p></div>
    </section>
    <section className="releasedApp__end"><h2>Before you forget.</h2><AppStoreLink product="forget-about-it" placement="footer" className="releasedApp__button" href={forgetRelease.url} /></section>
    <footer className="releasedApp__footer"><p>Forget About It · Koinophobia Labs</p><nav aria-label="Product help"><Link href="/forget-about-it/support">Support</Link><Link href="/forget-about-it/privacy">Privacy</Link><Link href="/products">All products</Link></nav><p className="releasedApp__note">This website measures product-page visits and App Store clicks with Vercel Analytics. The journal app itself has no analytics. We never collect your memories through this page.</p></footer>
  </main>;
}
