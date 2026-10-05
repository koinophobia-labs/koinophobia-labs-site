import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import AppStoreBadge from "@/components/site/AppStoreBadge";
import { ProductPageView } from "@/components/products/ProductAnalytics";
import { forgetRelease } from "@/lib/releases";
import { STUDIO_URL, socialCard } from "@/lib/seo";
import styles from "./commercial.module.css";

const title = "Forget About It — catch the thought before it goes";
const description = "A fleeting idea. A name to remember. The thing you meant to do. Capture it on iPhone or Apple Watch, then find your exact words later. Free, with optional Plus.";
export const metadata: Metadata = {
  title, description,
  alternates: { canonical: `${STUDIO_URL}/forget-about-it` },
  openGraph: { type: "website", siteName: "Koinophobia Labs", url: `${STUDIO_URL}/forget-about-it`, title, description, images: [socialCard("Catch the thought before it goes.", "Forget About It · iPhone + Apple Watch")] },
  twitter: { card: "summary_large_image", title, description, images: [socialCard("Catch the thought before it goes.", "Forget About It · iPhone + Apple Watch").url] },
};
const faqs = [
  ["Why use this instead of Notes?", "Notes is useful for documents, lists, and longer writing. Forget About It centers on a smaller habit: capture the fleeting thought, keep it in your day's timeline, and find the original words later. There is no folder or title to choose before saving. Use whichever capture habit you will actually return to."],
  ["Do I need an Apple Watch?", "No. Capture, browse, search, and export on iPhone. The optional Apple Watch companion gives you another place to capture when your phone is out of reach. It saves captures on the Watch and queues them for delivery to the paired iPhone."],
  ["What is free?", "Unlimited capture, all original history, text search, basic capture statistics, today's on-device reflection, and plain-text export. Watch capture is included. Plus is optional; it adds date and source filters, capture patterns, and earlier reflections for new users. Existing users retain previously available earlier reflections."],
  ["Does it work offline?", "Typing and reading work offline. Dictation availability depends on your device and system settings. Watch captures can wait for the paired iPhone to reconnect. Buying or restoring Plus requires communication with Apple."],
  ["Is this an AI assistant or a reminder app?", "It is a place to catch and return to thoughts. Separately labeled reflections use on-device rules; they do not rewrite your original words. It is not a conversational AI assistant, a medical product, or a guarantee that you will remember every task."],
  ["Where are my thoughts stored?", "On your devices. No app account is needed. The app has no developer analytics, advertising, or remote AI service. Apple handles subscriptions, and dictation follows the capabilities and settings of your devices. See the privacy policy for details."],
  ["Will my archive move to a new phone?", "There is no cloud archive recovery. The journal is excluded from device backups. Before changing or erasing a phone, use Settings → Save a copy of everything to keep a plain-text export. Export keeps a readable copy; it does not import your archive into a new installation."],
  ["How do I restore or cancel Plus?", "Open Settings → Restore purchases with the Apple Account that owns the subscription. Manage subscription opens Apple's controls for renewal and cancellation. Cancelling keeps access until the paid period ends. If plans are unavailable, your free capture and original history remain available."],
  ["Where is it available?", "The United States and Canada. iPhone requires iOS 17 or later; the optional paired Apple Watch companion requires watchOS 10 or later. This page promotes the iPhone and Watch experience."],
];

export default function ForgetAboutItPage({version = forgetRelease.version}: {version?: string}) {
  return <div className={styles.page}>
    <ProductPageView product="forget-about-it" />
    <nav className={styles.nav} aria-label="Product navigation"><Link href="/">Koinophobia Labs</Link><div><a href="#demo">See it</a><a href="#pricing">Pricing</a><Link href="/forget-about-it/support">Support</Link></div></nav>
    <main>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Forget About It · iPhone + Apple Watch</p>
          <h1>Catch the thought<br /><em>before it goes.</em></h1>
          <p className={styles.lede}>The idea between errands. The name you just heard. The thing you suddenly remembered. Give it a place to land, then carry on.</p>
          <AppStoreBadge product="forget-about-it" url={forgetRelease.url} placement="product_hero" priceLine="Free · optional Plus · no app account" version={version} />
          <p className={styles.small}>Available in the US and Canada. iOS 17+. Optional Watch companion: watchOS 10+.</p>
          <a className={styles.textLink} href="#demo">See the capture → find loop ↓</a>
        </div>
        <div className={styles.moment}>
          <p className={styles.eyebrow}>That “I’ll remember it” moment.</p>
          <blockquote>“Call Marcus<br />about the lease.”</blockquote>
          <p>Keep the words.<br />Free up your attention.</p>
          <figure className={styles.searchDetail}><Image src="/forget-about-it/product/search.png" width={1320} height={2868} sizes="(max-width: 700px) 90vw, 430px" alt="Real Forget About It search screen showing the saved thought Call Marcus about the lease." priority /><figcaption>1.1 interface · example content</figcaption></figure>
        </div>
      </section>
      <section className={styles.section} id="demo" aria-labelledby="demo-title">
        <p className={styles.eyebrow}>One small loop</p><h2 id="demo-title">A thought saved.<br />A thought you can find.</h2>
        <p className={styles.intro}>Open Today, type the words, and tap Save. Later, open Memory and search a word you remember. Here is the actual interface, captured on an iPhone during the 1.1 release checks.</p>
        <div className={styles.demoGrid}>
          <figure><span className={styles.step}>01 / Capture</span><h3>One field. One Save.</h3><Image src="/forget-about-it/product/saved.png" width={2868} height={1320} sizes="(max-width: 700px) 94vw, 560px" alt="Forget About It Today composer with its Save button and the Saved confirmation." /><figcaption>Saved confirmation · real iPhone capture</figcaption></figure>
          <figure><span className={styles.step}>02 / Keep</span><h3>Your exact words, in your day.</h3><Image src="/forget-about-it/product/timeline.png" width={2868} height={1320} sizes="(max-width: 700px) 94vw, 560px" alt="The Today timeline preserves Call Marcus about the lease and Marcus said he would send it tonight as separate original captures." /><figcaption>Real app screen · example thoughts</figcaption></figure>
        </div>
        <div className={styles.find}><span className={styles.step}>03 / Find</span><h3>Search “Marcus.” There it is.</h3><p>The search result shown above returns the original thought. Basic text search is free. Date and source filters are optional Plus tools.</p></div>
        <p className={styles.small}>These are retained 1.1 release-QA captures with example content, not a newly recorded App Store install or a timed speed test.</p>
      </section>
      <section className={`${styles.section} ${styles.watch}`}>
        <div><p className={styles.eyebrow}>When your phone is out of reach</p><h2>A place on<br />your wrist, too.</h2></div>
        <div><p>Open Forget About It on your Apple Watch and capture a thought by speaking, scribbling, or typing, as supported by your Watch. The companion saves it locally and queues delivery to your paired iPhone.</p><p>“Waiting for iPhone” means delivery has not been confirmed yet. Keep both apps installed and let the devices reconnect.</p><p className={styles.small}>Watch capture is free. Plus tools live on iPhone. A Watch is optional, and this is not a separate cloud archive.</p></div>
      </section>
      <section className={styles.section} id="pricing">
        <p className={styles.eyebrow}>Keep the habit free</p><h2>Capture first.<br />Choose Plus if you need it.</h2>
        <div className={styles.plans}>
          <article><p className={styles.eyebrow}>Everyday capture</p><h3>Free</h3><p className={styles.price}>$0</p><ul><li>Unlimited iPhone and Watch captures</li><li>All original history and text search</li><li>Today’s reflection and basic statistics</li><li>Plain-text export</li></ul><AppStoreBadge product="forget-about-it" url={forgetRelease.url} placement="product_end" /></article>
          <article><p className={styles.eyebrow}>More ways to return</p><h3>Forget About It Plus</h3><p className={styles.price}>US $2.99 <small>/ month</small></p><p>or US $24.99 / year</p><ul><li>Date and capture-source filters</li><li>Capture patterns across days and months</li><li>Earlier daily reflections for new users</li><li>Restore and manage through Apple</li></ul><p className={styles.small}>Canada: CA $3.99/month or CA $34.99/year. Open Settings → Explore Plus in the app.</p></article>
        </div>
        <p className={styles.small}>Plus is an optional auto-renewing subscription. Apple shows your storefront price before confirmation. Cancel at least 24 hours before renewal. Earlier users keep previously available reflections. Pricing checked October 5, 2026.</p>
      </section>
      <section className={`${styles.section} ${styles.privacy}`}><p className={styles.eyebrow}>Your words stay yours</p><h2>No app account.<br />No cloud archive.</h2><p>Thoughts are stored on your devices. Reflections are made by on-device rules and labeled separately. Your original words stay intact.</p><p>Keep a copy before changing phones: your journal is excluded from device backups. Use <strong>Settings → Save a copy of everything</strong> for a plain-text export.</p><Link href="/forget-about-it/privacy">Read the privacy policy ↗</Link></section>
      <section className={styles.section} id="faq"><p className={styles.eyebrow}>Before you start</p><h2>A few straight answers.</h2><div className={styles.faq}>{faqs.map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div></section>
      <section className={styles.final}><div><p className={styles.eyebrow}>Keep the next thought.</p><h2>Open. Capture.<br /><em>Carry on.</em></h2><AppStoreBadge product="forget-about-it" url={forgetRelease.url} placement="product_end" /><p>Start with one thing you nearly forgot today.</p></div><figure><Image src="/forget-about-it/qr.png" width={936} height={936} sizes="180px" alt="QR code opening koinophobialabs.com/forget-about-it" /><figcaption>Scan to open this page on your iPhone.</figcaption></figure></section>
    </main>
    <footer className={styles.footer}><Link href="/">Koinophobia Labs</Link><Link href="/forget-about-it/support">Support</Link><Link href="/forget-about-it/privacy">Privacy</Link><a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/">Terms of Use</a><a href="mailto:koinophobia999@gmail.com">Contact</a></footer>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify({"@context":"https://schema.org","@type":"SoftwareApplication",name:"Forget About It",operatingSystem:"iOS 17+, watchOS 10+",applicationCategory:"ProductivityApplication",url:`${STUDIO_URL}/forget-about-it`,installUrl:forgetRelease.url,softwareVersion:forgetRelease.version,offers:{"@type":"Offer",price:"0",priceCurrency:"USD"}})}} />
  </div>;
}
