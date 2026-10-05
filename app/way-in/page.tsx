import type { Metadata, Viewport } from "next";
import Image from "next/image";
import Link from "next/link";
import AppStoreBadge from "@/components/site/AppStoreBadge";
import DemoClip from "@/components/site/DemoClip";
import { ProductPageView } from "@/components/products/ProductAnalytics";
import { getSiteProduct } from "@/lib/products";
import { withLiveListing } from "@/lib/app-store";
import { wayInRelease } from "@/lib/releases";
import { STUDIO_URL, socialCard } from "@/lib/seo";
import styles from "./way-in.module.css";

const title = "Way In — turn your experience into your next application";
const description = "Moving beyond service, retail, or gig work? Build a résumé from real experience, check job fit, and keep applications moving. A private workspace for iPhone and iPad.";
export const metadata: Metadata = {
  title, description,
  alternates: { canonical: `${STUDIO_URL}/way-in` },
  openGraph: { type: "website", siteName: "Way In", url: `${STUDIO_URL}/way-in`, title, description,
    images: [socialCard("Your experience counts.", "Way In · Your next application starts here")] },
  twitter: { card: "summary_large_image", title, description,
    images: [socialCard("Your experience counts.", "Way In · iPhone + iPad").url] },
};
export const viewport: Viewport = { colorScheme: "light", themeColor: "#f4f6ee" };
const faqs = [
  ["Who is Way In for?", "Start here if you have experience in service, retail, gig work, caregiving, projects, or volunteering and need to explain how it fits your next role. You can also import an existing résumé. You don’t need a polished career story to begin."],
  ["What can I do for free?", "Capture your experience, start or import a résumé, save job postings, and compare your experience with a role. Full review, editing, and export of saved résumés require Resume Toolkit or an active Career Pass. You see the price before you buy."],
  ["Which purchase should I choose?", "Choose Resume Toolkit if you need to finish and export a résumé: $9.99 once, with no time limit. Choose the $29.99 30-Day Career Pass if you also want job-specific tailoring, application drafts, interview preparation, and career planning. The pass includes résumé access for those 30 days; you do not need to buy both."],
  ["Is this a subscription?", "Neither purchase auto-renews. Resume Toolkit is a permanent unlock. Career Pass expires 30 days after purchase, so there is no recurring charge to cancel. Prices shown here are US prices; Apple displays your local price before confirmation."],
  ["What happens when the pass ends?", "Your saved work remains on your device and exported files remain yours. Paid features lock when the pass expires. If you own Resume Toolkit separately, full résumé review, editing, and export remain available."],
  ["Why use this instead of ChatGPT or a résumé template?", "Way In keeps your experience, résumé versions, job requirements, application status, and next steps together. Fit checks distinguish supported experience, related experience, and gaps, with source excerpts where available. You can see what supports a suggestion and keep working from the same record."],
  ["Does it find jobs or apply for me?", "Way In is a preparation workspace, not a job board or recruiter. Bring a posting from the site you use. You review your materials and submit through the employer’s website, then record what happened. It does not guarantee interviews, offers, or applicant-tracking-system results."],
  ["Where does my information go?", "Career work is stored on your device by default. The native app does not send résumé text to a cloud AI service. Optional iCloud continuity uses your private iCloud Drive. Opening job links contacts the destination website; exporting or sharing sends only what you choose. No account is required."],
  ["Can I restore a purchase?", "Yes. Open Profile → Settings → Access → Restore App Store purchases using the Apple Account that made the purchase. An expired Career Pass does not restart when restored. If you need help, contact koinophobia999@gmail.com."],
];

export default async function WayInPage() {
  const product = await withLiveListing(getSiteProduct("career-forge")!);
  return <div className={styles.page}>
    <ProductPageView product="way-in" />
    <a className={styles.skip} href="#main">Skip to content</a>
    <header className={styles.nav}>
      <Link href="/way-in" className={styles.wordmark} aria-label="Way In home"><span aria-hidden="true">↗</span> Way In</Link>
      <nav aria-label="Way In"><a href="#how">How it works</a><a href="#pricing">Pricing</a><Link href="/way-in/support">Help</Link></nav>
    </header>
    <main id="main">
      <section className={styles.hero} aria-labelledby="hero-title">
        <div>
          <p className={styles.eyebrow}>For your move beyond service, retail &amp; gig work</p>
          <h1 id="hero-title">Your experience <em>counts.</em><br />Make it part of your next application.</h1>
          <p className={styles.lede}>You’ve handled customers, solved problems, and kept things running. Way In helps you put that experience into a résumé, check it against a real job, and keep your next steps together.</p>
          <p className={styles.category}>Your private résumé and application workspace. iPhone + iPad.</p>
          <div className={styles.actions}>
            <AppStoreBadge product="career-forge" url={wayInRelease.url} placement="product_hero" />
            <a className={styles.textLink} href="#demo">See it work in 18 seconds ↗</a>
          </div>
          <p className={styles.small}>Start free · No account required · Optional purchases, no auto-renewal</p>
        </div>
        <figure className={styles.phone}>
          <Image src="/way-in/today.webp" alt="Way In Today screen showing a saved role, interview preparation, and the next step in an example job search" width={600} height={1304} priority sizes="(max-width: 700px) 260px, 310px" />
          <figcaption>Real app screen. Example career data.</figcaption>
        </figure>
      </section>
      <section className={styles.problem}>
        <p className={styles.eyebrow}>The hard part isn’t always the work.</p>
        <h2>It’s explaining why that work matters for the job you want.</h2>
        <p>A blank résumé makes a busy shift look like nothing. A long job posting makes every gap look disqualifying. Start with what you actually did, see what connects, and decide what to do next.</p>
      </section>
      <section className={styles.section} id="how" aria-labelledby="how-title">
        <p className={styles.eyebrow}>One workspace. A clear next step.</p>
        <h2 id="how-title">From “I’ve done a lot” to “here’s what I can bring.”</h2>
        <div className={styles.steps}>
          <article><span>01</span><h3>Bring your real experience.</h3><p>Import a résumé or start with a few true sentences. Jobs, school, projects, caregiving, and volunteering all count.</p></article>
          <article><span>02</span><h3>Check it against a role.</h3><p>Save a posting. See where your experience supports a requirement, where it’s related, and where you still need evidence.</p></article>
          <article><span>03</span><h3>Prepare, send, follow through.</h3><p>Unlock résumé editing and PDF/DOCX export when you’re ready. Keep the posting, your materials, and your next step together.</p></article>
        </div>
      </section>
      <section className={`${styles.section} ${styles.demo}`} id="demo" aria-labelledby="demo-title">
        <p className={styles.eyebrow}>Watch the product</p>
        <h2 id="demo-title">Does my experience fit this job?</h2>
        <p className={styles.lede}>See a posting compared with a career profile, with evidence behind the result.</p>
        <DemoClip product={product} />
        <p className={styles.small}>Recorded app walkthrough with example data. Appearance may vary by version.</p>
      </section>
      <section className={styles.section} aria-labelledby="difference-title">
        <p className={styles.eyebrow}>Built for the application you’ll actually send</p>
        <h2 id="difference-title">Keep the facts. Keep the context. Keep moving.</h2>
        <div className={styles.steps}>
          <article><h3>Experience you can stand behind</h3><p>Work from your own facts. Review suggestions before using them; Way In does not supply invented employers, credentials, or achievements.</p></article>
          <article><h3>More than a document</h3><p>Your résumé versions live beside saved jobs, application progress, interview preparation, and follow-up notes.</p></article>
          <article><h3>A private place to start over</h3><p>Career work stays on your device by default. Optional iCloud continuity is your choice. No cloud AI account is needed.</p></article>
        </div>
      </section>
      <section className={styles.section} id="pricing" aria-labelledby="pricing-title">
        <p className={styles.eyebrow}>A clear offer</p><h2 id="pricing-title">Start free. Pay for the step you need.</h2>
        <div className={styles.plans}>
          <article className={styles.plan}><p className={styles.eyebrow}>Get started</p><h3>Free</h3><p className={styles.price}>$0</p><p>Get your experience and search into one place.</p><ul><li>Capture your career experience</li><li>Start or import a résumé</li><li>Save jobs and check experience fit</li><li>Track applications and next steps</li></ul><p className={styles.small}>Full saved-résumé review, editing, and export require a purchase.</p></article>
          <article className={`${styles.plan} ${styles.recommended}`}><p className={styles.eyebrow}>Best for your résumé</p><h3>Resume Toolkit</h3><p className={styles.price}>$9.99 <small>once</small></p><p>Finish a résumé you can send with confidence.</p><ul><li>Full saved-résumé review and editing</li><li>PDF and editable DOCX export</li><li>Saved résumé versions</li><li>No time limit. No auto-renewal.</li></ul><a href={wayInRelease.url} className={styles.planCta}>Get Way In. Choose Toolkit in the app ↗</a></article>
          <article className={styles.plan}><p className={styles.eyebrow}>For an active job search</p><h3>30-Day Career Pass</h3><p className={styles.price}>$29.99 <small>/ 30 days</small></p><p>Prepare for each role, from application to interview.</p><ul><li>Full résumé access for 30 days</li><li>Job-specific tailoring and application drafts</li><li>Interview preparation and career planning</li><li>Expires automatically. No recurring charge.</li></ul><p className={styles.small}>Toolkit is not required. Permanent Toolkit access is a separate purchase.</p></article>
        </div>
        <p className={styles.small}>US prices. Purchases are made in the iOS app through Apple. Your local price is shown before confirmation. No purchase is required to download.</p>
      </section>
      <section className={styles.section} id="faq" aria-labelledby="faq-title"><p className={styles.eyebrow}>Before you start</p><h2 id="faq-title">A few straight answers.</h2><div className={styles.faq}>{faqs.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div></section>
      <section className={styles.trust}><h2>Your career story is yours.</h2><p>No fabricated success claims. No promise of a job. Just a practical place to turn your own experience into materials you can review and use.</p><div><Link href="/way-in/privacy">Privacy</Link><Link href="/way-in/terms">Purchase terms</Link><Link href="/way-in/support">Support</Link></div></section>
      <section className={styles.final}><p className={styles.eyebrow}>You don’t need a perfect résumé to begin.</p><h2>Start with the work<br />you already do.</h2><AppStoreBadge product="career-forge" url={wayInRelease.url} placement="product_end" /><p>Download Way In. Start free.</p></section>
    </main>
    <footer className={styles.footer}><Link href="/">Made by Koinophobia Labs</Link><span>Way In · iPhone + iPad</span><Link href="/way-in/support">Talk to support</Link></footer>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Way In: Career Hub", operatingSystem: "iOS 17.0+, iPadOS 17.0+", applicationCategory: "ProductivityApplication", url: `${STUDIO_URL}/way-in`, installUrl: wayInRelease.url, offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } }) }} />
  </div>;
}
