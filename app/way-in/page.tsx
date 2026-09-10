import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AppStoreLink, ProductPageView } from "@/components/products/ProductAnalytics";
import { wayInRelease } from "@/lib/releases";
import { LINKS } from "@/lib/links";
import "../released-app.css";

export const metadata: Metadata = {
  title: "Way In | Your next career move",
  description: "Bring your real experience, resumes, job-fit analysis, interview preparation, and application tracking together. Way In is available for iPhone and iPad.",
  alternates: { canonical: "https://koinophobialabs.com/way-in" },
  openGraph: { url: "/way-in", images: ["/way-in/store/1.jpg"] },
};

export default function WayInPage() {
  return <main className="releasedApp">
    <ProductPageView product="way-in" />
    <nav className="releasedApp__nav" aria-label="Way In navigation"><Link href="/"><Image src="/brand/koinophobia-labs-koi-640.webp" alt="" width={32} height={32} /> Koinophobia Labs</Link><div><Link href="/products">Products</Link><a href="mailto:koinophobia999@gmail.com?subject=Way%20In%20support">Support</a><a href="https://careerforge.koinophobialabs.com/privacy">Privacy</a></div></nav>
    <section className="releasedApp__hero"><div><p className="releasedApp__eyebrow">Way In · Career Hub</p><h1>Your experience.<br />A clearer next move.</h1><p className="releasedApp__lede">Scattered resumes, saved jobs, and forgotten follow-ups make a job search hard to move forward. Way In brings them into one private career workspace, grounded in the facts you approve.</p><AppStoreLink product="way-in" placement="hero" className="releasedApp__button" href={wayInRelease.url} /><p className="releasedApp__note">Free to download · iPhone and iPad · Optional in-app purchases</p><a className="releasedApp__textLink" href="#career-forge-web">Looking for Career Forge on the web?</a></div><Image className="releasedApp__heroShot" src="/way-in/store/1.jpg" alt="Way In Today screen with an interview preparation next action" width={600} height={1304} sizes="(max-width: 760px) 75vw, 300px" priority /></section>
    <section className="releasedApp__section"><p className="releasedApp__eyebrow">The released app</p><h2>Know what to work on next.</h2><p>These are screenshots from Way In’s current App Store listing.</p><div className="releasedApp__screens">{[[1,"See your next action and search progress"],[2,"Keep your career work organized"],[3,"Work from your real experience"]].map(([n,alt])=><figure key={n}><Image src={`/way-in/store/${n}.jpg`} alt={String(alt)} width={600} height={1304} sizes="(max-width: 700px) 85vw, 30vw" /><figcaption>{alt}</figcaption></figure>)}</div></section>
    <section className="releasedApp__section releasedApp__features" aria-label="Way In features"><article><span>01</span><h2>Start with your facts</h2><p>Build a reusable Career Profile, import and review resumes, keep saved versions, and evaluate fit against an actual job posting.</p></article><article><span>02</span><h2>Prepare with context</h2><p>Tailor resumes without inventing achievements. Prepare interview questions and stories grounded in your experience. Scores explain their limits and are not hiring predictions.</p></article><article><span>03</span><h2>Keep the search moving</h2><p>Track applications, follow-ups, interview rounds, outcomes, and relationships. Way In does not apply to jobs for you or guarantee interviews or offers.</p></article></section>
    <section className="releasedApp__section releasedApp__details"><div><h2>Start with free review</h2><p>Free access includes resume review and job-fit analysis. Optional App Store purchases unlock export, tailoring, interview preparation, and planning. The 30-Day Career Pass does not auto-renew.</p><p>Check the current price and included access in the app before buying. Restore eligible purchases from Settings.</p></div><div><h2>Your workspace begins on device</h2><p>Optional product-proof measurement is opt-in. It measures limited milestones and aggregate outcomes, not your resume, job, contact, transcript, or note text. You can stop and delete measurements in the app.</p><p><a href="https://careerforge.koinophobialabs.com/privacy">Read the current privacy policy</a> or <a href="mailto:koinophobia999@gmail.com?subject=Way%20In%20support">contact support</a>.</p></div></section>
    <section className="releasedApp__section releasedApp__details" id="career-forge-web"><div><h2>Career Forge on the web</h2><p>Career Forge is now named Way In on the web too. The existing browser product and its original destination remain available, alongside the released native career app.</p><a className="releasedApp__textLink" href={LINKS.careerForge}>Open Way In web ↗</a></div><div><h2>Available now</h2><p>Version {wayInRelease.version}. Requires iOS 17.0 or iPadOS 17.0 or later. Apple also lists macOS 14.0 or later on an Apple M1 Mac or newer, and visionOS 1.0 or later.</p><p className="releasedApp__note">Public US listing checked September 10, 2026.</p></div></section>
    <section className="releasedApp__end"><h2>Take the next step with what you know.</h2><AppStoreLink product="way-in" placement="footer" className="releasedApp__button" href={wayInRelease.url} /></section>
    <footer className="releasedApp__footer"><p>Way In · Koinophobia Labs</p><nav aria-label="Way In help"><a href="mailto:koinophobia999@gmail.com?subject=Way%20In%20support">Support</a><a href="https://careerforge.koinophobialabs.com/privacy">Privacy</a><Link href="/products">All products</Link></nav></footer>
  </main>;
}
