import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import AppStoreBadge from "@/components/site/AppStoreBadge";
import { ProductPageView } from "@/components/products/ProductAnalytics";
import DemoClip from "@/components/site/DemoClip";
import { getSiteProduct } from "@/lib/products";
import { withLiveListing } from "@/lib/app-store";
import { trendiRelease } from "@/lib/releases";
import { STUDIO_URL, socialCard } from "@/lib/seo";
import styles from "./commercial.module.css";

const pitch = "Turn what you know about your business into a script you can record. Hooks, scripts, a teleprompter, and your saved ideas in one iPhone workspace.";
const title = "Trendi — business idea to recordable script";
export const metadata: Metadata = {
  title, description: pitch,
  alternates: { canonical: `${STUDIO_URL}/trendi` },
  openGraph: { type: "website", siteName: "Koinophobia Labs", url: `${STUDIO_URL}/trendi`, title, description: pitch, images: [socialCard("You know your business. Know what to say.", "Trendi · idea to camera")] },
  twitter: { card: "summary_large_image", title, description: pitch, images: [socialCard("You know your business. Know what to say.", "Trendi · idea to camera").url] },
};
const faqs = [
  ["Do I need to be a creator?", "No. Start with something you explain at work: a customer question, a common mistake, a decision, or a useful lesson. Trendi gives you a structure you can edit and say in your own words."],
  ["What exactly is a Coach Pack?", "One angle, three opening hooks, an editable script, a caption, and a simple shot plan. It is generated from the thought and selected profile context you provide. Review the details and claims before recording."],
  ["What can I do for free?", "Get up to three successfully delivered Coach Packs per weekly allowance period. Capture ideas, edit scripts, use the Vault, and record with the teleprompter. Pro increases the Coach Pack allowance to 100 per subscription month; it does not unlock a different editor or camera."],
  ["Does Trendi post or schedule for me?", "You choose where and when to publish. Trendi helps prepare and record the content; copy your caption and save or share your take through iOS. It does not connect to social accounts or automatically post."],
  ["Is my business information private?", "Your Vault and recordings live on your device. When you request AI coaching, your selected thought or draft and relevant profile context go to Trendi’s backend and Anthropic. Speech recognition may use Apple’s servers. Device backups, Photos, and anything you share follow your Apple settings. Avoid confidential client information in a request."],
  ["Can I use it offline?", "You can work with saved ideas and scripts and use recording features offline. New Coach Packs, sign-in, and purchase verification need internet. Keep exports of work you need; the Vault is not a cloud backup service."],
  ["How do I cancel or restore Pro?", "Cancel in Apple’s subscription settings. Pro auto-renews monthly unless canceled at least 24 hours before the period ends. Restore Purchases is in Trendi’s Pro screen and Profile. Use the Apple Account that made the purchase. Canceling does not delete your saved drafts."],
];
const scenes = [
  { file: "hooks", title: "Find your opening.", text: "Choose one of three hooks, then make the words yours.", alt: "Trendi 0.2.3 Coach Pack with three hook choices and an editable script, using a coffee shop example" },
  { file: "record", title: "Take the script to camera.", text: "Read the whole script or record one section at a time.", alt: "Trendi 0.2.3 Record Mode preparation with full-script and section-by-section choices" },
  { file: "vault", title: "Pick it up tomorrow.", text: "Return to saved ideas and unfinished drafts in your Vault.", alt: "Trendi 0.2.3 on-device Vault with an example draft and a Continue action" },
];
export default async function TrendiPage() {
  const product = await withLiveListing(getSiteProduct("trendi")!);
  return <div className={styles.page}>
    <ProductPageView product="trendi" />
    <a className={styles.skip} href="#main">Skip to content</a>
    <header className={styles.nav}>
      <Link href="/trendi" className={styles.wordmark}>Trendi<span>by Koinophobia Labs</span></Link>
      <nav aria-label="Trendi"><a href="#how">How it works</a><a href="#pricing">Free &amp; Pro</a><Link href="/trendi/support">Help</Link></nav>
    </header>
    <main id="main">
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>For business owners with something to say</p>
          <h1 id="hero-title">You know<br />your business.<br /><em>Know what to say.</em></h1>
          <p className={styles.lede}>Turn a customer question, a lesson from your work, or a rough idea into a script you can record. Then open the teleprompter and make the video.</p>
          <p className={styles.category}>Your idea-to-camera workspace for iPhone.</p>
          <div className={styles.actions}><AppStoreBadge product="trendi" url={trendiRelease.url} placement="product_hero" /><a className={styles.textLink} href="#demo">See the real app ↓</a></div>
          <p className={styles.small}>Start free · 3 Coach Packs a week · iOS 17 or later</p>
        </div>
        <figure className={styles.heroVisual}>
          <div className={styles.note}><span>ONE IDEA IN.</span><p>An angle. Three hooks.<br />Words you can record.</p></div>
          <Image src="/trendi/product/coach-pack.png" width={1125} height={2001} sizes="(max-width: 700px) 78vw, 320px" preload alt="Real Trendi Coach Pack screen showing a coffee shop example: an angle, three hooks, and a script" />
          <figcaption>Real app screen · example content</figcaption>
        </figure>
      </section>
      <section className={`${styles.section} ${styles.problem}`}>
        <p className={styles.eyebrow}>Running a business is already a job.</p>
        <h2>Making one video<br />shouldn’t become another.</h2>
        <p>You answer useful questions all day. Then it’s time to post, and you’re staring at a blank note. Trendi helps you turn the explanation you already give into something you can say on camera.</p>
        <p className={styles.small}>Built around solo business owners, consultants, and service professionals who make their own content.</p>
      </section>
      <section className={styles.section} id="how" aria-labelledby="how-title">
        <p className={styles.eyebrow}>One idea. A clear next step.</p><h2 id="how-title">From “I should post”<br />to words worth recording.</h2>
        <div className={styles.steps}>
          <article><span>01 / Bring the idea</span><h3>Say it how you’d explain it.</h3><p>Type or speak a customer question, a useful lesson, or a common mistake. Add your audience and perspective in Profile to give the Coach context.</p></article>
          <article><span>02 / Shape the script</span><h3>Choose an opening. Keep your point.</h3><p>Your Coach Pack gives you an angle, three hooks, a script, a caption, and a shot plan. Edit the words until they sound like you.</p></article>
          <article><span>03 / Make the video</span><h3>Open the teleprompter. Try a take.</h3><p>Adjust the text and pace. Record section by section or as a full script, then save or share your take. You choose where to publish.</p></article>
        </div>
      </section>
      <section className={`${styles.section} ${styles.demo}`} id="demo" aria-labelledby="demo-title">
        <div><p className={styles.eyebrow}>Watch the idea become usable</p><h2 id="demo-title">A rough thought.<br />Three ways to start.</h2><p>This recorded walkthrough shows a real Coach Pack returning from an everyday idea.</p><p className={styles.small}>Recorded in version 0.2.2. The screens below show the newer 0.2.3 design. Example data, not customer results.</p></div>
        <DemoClip product={product} />
      </section>
      <section className={styles.section} aria-labelledby="screens-title">
        <p className={styles.eyebrow}>The work stays connected</p><h2 id="screens-title">A script is useful.<br />A next step is better.</h2>
        <div className={styles.screens}>{scenes.map(scene => <figure key={scene.file}><h3>{scene.title}</h3><p>{scene.text}</p><Image src={`/trendi/product/${scene.file}.png`} width={1125} height={2001} sizes="(max-width: 700px) 82vw, 300px" alt={scene.alt} /><figcaption>Real app screen · example content</figcaption></figure>)}</div>
      </section>
      <section className={`${styles.section} ${styles.difference}`} aria-labelledby="difference-title">
        <p className={styles.eyebrow}>Why add Trendi to your phone?</p><h2 id="difference-title">Fewer handoffs<br />between the idea and the take.</h2>
        <p>ChatGPT can help write. Notes can hold ideas. A teleprompter can help you read. Trendi puts the handoff between those jobs in the same workspace: a Coach Pack becomes an editable draft, the draft opens in Record Mode, and the saved work stays in your Vault.</p>
        <p>You don’t need to rebuild that sequence every time you have something to explain.</p>
      </section>
      <section className={styles.section} id="pricing" aria-labelledby="pricing-title">
        <p className={styles.eyebrow}>Use the whole workflow first</p><h2 id="pricing-title">Start free.<br />Go Pro when you need more scripts.</h2>
        <div className={styles.plans}>
          <article className={styles.plan}><p className={styles.eyebrow}>Your first videos</p><h3>Trendi Free</h3><p className={styles.price}>$0</p><p>Make your first useful script before deciding to pay.</p><ul><li>3 delivered Coach Packs per week</li><li>Idea capture and script editing</li><li>Teleprompter and recording</li><li>On-device Vault and saved work</li></ul><AppStoreBadge product="trendi" url={trendiRelease.url} placement="product_end" /></article>
          <article className={`${styles.plan} ${styles.pro}`}><p className={styles.eyebrow}>For more frequent content</p><h3>Trendi Pro</h3><p className={styles.price}>$7.99 <small>/ month</small></p><p>More room for customer questions, different angles, and the next video.</p><ul><li>100 delivered Coach Packs each subscription month</li><li>The same editor, teleprompter, and Vault</li><li>Only delivered Coach Packs use your allowance</li><li>Manage or cancel through Apple</li></ul><p className={styles.small}>One plan. Upgrade in the app when Free no longer covers your work.</p></article>
        </div>
        <p className={styles.small}>US price. Apple shows your local price before you confirm. Pro is an optional auto-renewing monthly subscription. Cancel at least 24 hours before renewal. Your saved work remains available on Free.</p>
      </section>
      <section className={`${styles.section} ${styles.privacy}`}>
        <p className={styles.eyebrow}>Know where your work goes</p><h2>Your Vault lives on your iPhone.</h2><p>Your saved ideas, drafts, and recordings stay on your device unless you export or share them. Requesting AI coaching sends the selected idea or draft and relevant profile context to Trendi’s backend and Anthropic. Trendi is not a fully offline AI tool or a cloud backup for your Vault.</p><div className={styles.trustLinks}><Link href="/trendi/privacy">Read the privacy policy ↗</Link><Link href="/trendi/support">Get help ↗</Link></div>
      </section>
      <section className={styles.section} id="faq" aria-labelledby="faq-title"><p className={styles.eyebrow}>Before you start</p><h2 id="faq-title">A few straight answers.</h2><div className={styles.faq}>{faqs.map(([q,a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div></section>
      <section className={styles.final}><p className={styles.eyebrow}>Start with a question you answered today.</p><h2>You already have<br />something to say.</h2><AppStoreBadge product="trendi" url={trendiRelease.url} placement="product_end" /><p>Get Trendi. Make your first script.</p></section>
    </main>
    <footer className={styles.footer}><Link href="/">Koinophobia Labs</Link><Link href="/trendi/support">Support &amp; feedback</Link><Link href="/trendi/privacy">Privacy</Link><a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/">Terms of Use</a></footer>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Trendi: Content Coach", operatingSystem: "iOS 17.0+", applicationCategory: "MultimediaApplication", url: `${STUDIO_URL}/trendi`, installUrl: trendiRelease.url, softwareVersion: product.appStore?.version ?? trendiRelease.version, offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } }) }} />
  </div>;
}
