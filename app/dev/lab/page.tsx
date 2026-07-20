import type { Metadata } from "next";
import DevShell from "@/components/dev/DevShell";
import { experiments, labLastUpdated } from "@/lib/dev/lab";

// koinophobia.dev/lab via host rewrite. Experiments that actually ran —
// no roadmap items, no "exploring", nothing aspirational.

export const metadata: Metadata = {
  title: { absolute: "The Lab — Blake Taylor" },
  description:
    "Experiments that actually ran: a debate tournament harness, a claims gate, a contrast checker, a companion fish, and a headless UI puppet.",
  alternates: { canonical: "https://koinophobia.dev/lab" },
  openGraph: {
    type: "website",
    siteName: "koinophobia.dev",
    url: "https://koinophobia.dev/lab",
    title: "The Lab — Blake Taylor",
    description: "Small machines I built to answer a question, and what each one showed.",
    images: [{ url: "https://koinophobia.dev/og-founder.png", width: 1200, height: 630 }],
  },
};

export default function DevLabPage() {
  return (
    <DevShell current="/lab" fieldX="20%">
      <section className="devsec__head">
        <p className="devpage__kicker">The lab · {experiments.length} artifacts</p>
        <h1>Small machines built to answer one question.</h1>
        <p className="devpage__lede">
          These aren&apos;t products and most of them will never be. They&apos;re the things I
          built when I needed to know whether something was true — whether a score meant anything,
          whether a colour was readable, whether a fish could be useful. Each one ran, and each one
          told me something I didn&apos;t already believe.
        </p>
        <p className="devsec__stamp">Updated {labLastUpdated}</p>
      </section>

      <ul className="devlab__list">
        {experiments.map((experiment) => (
          <li className="devlab__item" key={experiment.name}>
            <div>
              <h2>{experiment.name}</h2>
              <p className="devlab__kind">{experiment.kind}</p>
              {experiment.live ? <p className="devlab__live">{experiment.live}</p> : null}
            </div>
            <div>
              <p className="devlab__body">{experiment.body}</p>
              <p className="devlab__finding">{experiment.finding}</p>
            </div>
          </li>
        ))}
      </ul>
    </DevShell>
  );
}
