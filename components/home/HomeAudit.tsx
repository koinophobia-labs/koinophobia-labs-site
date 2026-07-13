import Link from "next/link";
import { link } from "@/lib/links";

// The single deliberate dark cinematic section. The real offer, price ($250),
// fulfillment flow and business rules live on /audit — this section links
// there rather than restating or inferring pricing from the mock.
export default function HomeAudit() {
  return (
    <section id="audit" className="kl-audit" aria-labelledby="audit-title">
      <div className="kl-audit__inner">
        <div>
          <div className="kl-audit__kicker">
            <span className="kl-rule-gold" aria-hidden="true" />
            <span className="kl-mono">THE REVENUE LEAK AUDIT</span>
          </div>
          <h2 id="audit-title" className="kl-audit__h2">
            Your website is probably leaking revenue. Let&apos;s find where.
          </h2>
          <p className="kl-audit__body">
            A close read of where your site loses people, and the fixes in
            priority order — the same method behind every Koinophobia Labs
            product. You leave with a leak map and a plan you can act on, with
            the studio or without it.
          </p>
          <div className="kl-audit__cta">
            <Link className="kl-btn kl-btn--light" href="/audit">
              Request an audit
            </Link>
            <a className="kl-link kl-link--dark" href={link("email")}>
              Or just email Blake →
            </a>
          </div>
        </div>

        <div className="kl-audit__panel">
          <p>
            <b>What it covers.</b> First impression, message clarity, path to
            action, mobile experience, and the places visitors quietly give up.
          </p>
          <p>
            <b>What you get.</b> A prioritized leak map, honest constraints
            included — no padding, no upsell theater.
          </p>
        </div>
      </div>
    </section>
  );
}
