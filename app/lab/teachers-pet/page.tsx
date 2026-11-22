import type { Metadata } from "next";
import Link from "next/link";
import Masthead from "@/components/site/Masthead";
import SiteFooter from "@/components/site/SiteFooter";
import EvidenceDetails from "@/components/site/EvidenceDetails";
import { getSiteProduct } from "@/lib/products";
import { teachersPetRelease } from "@/lib/releases";
import { STUDIO_URL, socialCard } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Teacher's Pet · Public release and history",
  description: "Teacher's Pet is on the App Store. Public version 1.0 was released November 6, 2026, with iPhone and Mac compatibility listed by Apple.",
  alternates: { canonical: `${STUDIO_URL}/lab/teachers-pet` },
  openGraph: { url: `${STUDIO_URL}/lab/teachers-pet`, images: [socialCard("Your personal school at home.", "Teacher's Pet")] },
};

export default function TeachersPetPage() {
  const product = getSiteProduct("teachers-pet")!;
  return (
    <div className="site" data-motion-shell>
      <Masthead current="/teachers-pet" />
      <main className="shell page">
        <header className="page-head">
          <p className="k">Teacher&apos;s Pet · Shipped · iPhone and Mac</p>
          <h1>Your personal school at home.</h1>
          <p className="lede">
            Teacher&apos;s Pet is publicly available on the App Store. Apple&apos;s public lookup
            reports version {teachersPetRelease.version}, released November 6, 2026.
            The listing includes iPhone (iOS 17+) and Mac (macOS 15+) compatibility.
          </p>
          <div className="actions">
            <a className="btn btn--primary ai" href={teachersPetRelease.url} target="_blank" rel="noreferrer">View on the App Store</a>
            <Link className="btn ai" href="/teachers-pet">Explore Teacher&apos;s Pet</Link>
          </div>
        </header>
        <section className="sec" aria-labelledby="release">
          <p className="k">Public release · verified {teachersPetRelease.verifiedAt}</p>
          <h2 id="release">Family learning, with an adult involved.</h2>
          <p className="lede">
            The public listing describes lessons, practice, learner profiles and adult review.
            The app is free to download, with family subscriptions offered through the App Store.
            See the listing for current pricing and compatibility.
          </p>
          <p>
            Public availability does not establish learning outcomes or curriculum certification.
            Current completion counts have not been independently reverified here.
          </p>
        </section>
        <section className="sec" aria-labelledby="history">
          <p className="k">Development history · September 2026</p>
          <h2 id="history">The map and the first course.</h2>
          <p>
            The September record counted 13 grades, 4 subjects, 52 courses, 318 units and
            1,273 mapped objectives, with 100 objectives complete. Algebra Foundations was
            the first complete course in that record. These are dated development facts,
            not a current completion inventory.
          </p>
          <p>
            The earlier local build and planned TestFlight upload preceded the public release.
            The App Store listing now provides the installation path.
          </p>
          <EvidenceDetails evidence={product.evidence} />
        </section>
        <SiteFooter />
      </main>
    </div>
  );
}
