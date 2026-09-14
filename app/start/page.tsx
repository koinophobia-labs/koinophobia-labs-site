import type { Metadata } from "next";
import Masthead from "@/components/site/Masthead";
import SiteFooter from "@/components/site/SiteFooter";
import StartForm from "@/components/site/StartForm";
import { LINKS } from "@/lib/links";
import { replyPromise } from "@/lib/products";
import { STUDIO_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Start a project",
  description: `Tell Blake the idea in two paragraphs. Hear back ${replyPromise} with a real answer.`,
  alternates: { canonical: `${STUDIO_URL}/start` },
  robots: { index: false, follow: true },
};

export default function StartPage() {
  return (
    <div className="site" data-motion-shell>
      <Masthead current="/work-with-me" />
      <main className="shell page">
        <section className="two" aria-labelledby="start-title">
          <div className="page-head">
            <p className="k s">
              <b>Start a project</b>
            </p>
            <h1 id="start-title" className="s" style={{ "--i": 1 } as React.CSSProperties}>
              Tell me the idea.
            </h1>
            <p className="lede s" style={{ "--i": 2 } as React.CSSProperties}>
              Two paragraphs are plenty. You&apos;ll hear back {replyPromise}, and the reply might be
              a question, or &ldquo;don&apos;t build this yet.&rdquo;
            </p>
            <p className="s" style={{ "--i": 3 } as React.CSSProperties}>
              Prefer email? <a href={`${LINKS.email}?subject=Project%20idea`}>koinophobia999@gmail.com</a>
            </p>
          </div>
          <div className="s" style={{ "--i": 2 } as React.CSSProperties}>
            <StartForm />
          </div>
        </section>
        <SiteFooter />
      </main>
    </div>
  );
}
