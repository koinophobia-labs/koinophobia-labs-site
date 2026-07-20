import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import DevShell from "@/components/dev/DevShell";
import { getProduct, products, reachLabel } from "@/lib/dev/universe";

// Served as koinophobia.dev/products/[slug] via a host rewrite.
// Next 16: `params` is a Promise in pages and generateMetadata.

export function generateStaticParams() {
  return products.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const product = getProduct((await params).slug);
  if (!product) return {};
  const url = `https://koinophobia.dev/products/${product.slug}`;
  return {
    title: { absolute: `${product.name} — Blake Taylor` },
    description: `${product.tagline} ${product.status}.`,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      siteName: "koinophobia.dev",
      url,
      title: `${product.name} — ${product.tagline}`,
      description: product.status,
      images: [{ url: "https://koinophobia.dev/og-founder.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} — ${product.tagline}`,
      description: product.status,
      images: ["https://koinophobia.dev/og-founder.png"],
    },
  };
}

/** Only You Know Ball has a scoreboard — it's the one product whose whole
 *  argument is a number, so it's the one page that gets to shout numbers. */
const ARENA_STATS = [
  { label: "Simulated games", value: "4,500" },
  { label: "Blind play wins", value: "2.36%" },
  { label: "Expert play wins", value: "100%" },
  { label: "Topics, 5 sports", value: "460" },
];

export default async function DevProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const product = getProduct((await params).slug);
  if (!product) notFound();

  const index = products.findIndex((p) => p.slug === product.slug);
  const next = products[(index + 1) % products.length];

  return (
    <DevShell world={product.identity.theme} current="/products" fieldX="30%">
      <article>
        <section className="devprod__hero">
          <Link className="devpage__back" href="/products">
            <ArrowLeft size={13} aria-hidden="true" /> All products
          </Link>
          <p className="devpage__kicker" style={{ marginTop: 22 }}>
            {product.identity.register}
          </p>
          <h1>{product.name}</h1>
          <p className="devprod__tagline">{product.tagline}</p>
          <div className="devprod__statusline">
            <span className="devpage__reach" data-reach={product.reach}>
              {reachLabel[product.reach]}
            </span>
            <p>{product.status}</p>
          </div>
          {product.actions.length > 0 ? (
            <div className="devprod__actions">
              {product.actions.map((action) =>
                action.external ? (
                  <a
                    key={action.label}
                    className={
                      action.primary ? "devpage__btn" : "devpage__btn devpage__btn--ghost"
                    }
                    href={action.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${action.label} (opens in a new tab)`}
                  >
                    {action.label} <ArrowUpRight size={15} aria-hidden="true" />
                  </a>
                ) : action.href.startsWith("mailto:") ? (
                  <a
                    key={action.label}
                    className={
                      action.primary ? "devpage__btn" : "devpage__btn devpage__btn--ghost"
                    }
                    href={action.href}
                  >
                    {action.label}
                  </a>
                ) : (
                  <Link
                    key={action.label}
                    className={
                      action.primary ? "devpage__btn" : "devpage__btn devpage__btn--ghost"
                    }
                    href={action.href}
                  >
                    {action.label}
                  </Link>
                ),
              )}
            </div>
          ) : null}
        </section>

        <section className="devprod__section" aria-labelledby="prod-problem">
          <h2 id="prod-problem">The human problem</h2>
          <div className="devprod__prose">
            <p>{product.problem}</p>
          </div>
        </section>

        <section className="devprod__section" aria-labelledby="prod-thesis">
          <h2 id="prod-thesis">The thesis</h2>
          <p className="devprod__thesis">{product.thesis}</p>
        </section>

        <section className="devprod__section" aria-labelledby="prod-state">
          <h2 id="prod-state">Where it actually stands</h2>
          <ul className="devprod__state">
            {product.state.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          {product.slug === "you-know-ball" ? (
            <dl className="devprod__scoreboard">
              {ARENA_STATS.map((stat) => (
                <div key={stat.label}>
                  <dt>{stat.label}</dt>
                  <dd>{stat.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </section>

        <section className="devprod__section" aria-labelledby="prod-decisions">
          <h2 id="prod-decisions">Decisions and tradeoffs</h2>
          <div className="devprod__decisions">
            {product.decisions.map((decision) => (
              <div className="devprod__decision" key={decision.call}>
                <h3>{decision.call}</h3>
                <p>{decision.why}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="devprod__section" aria-labelledby="prod-learned">
          <h2 id="prod-learned">What building it taught me</h2>
          <p className="devprod__learned">{product.learned}</p>
        </section>

        <section className="devprod__section">
          <div className="devprod__notyet">
            <h2>What isn&apos;t true yet</h2>
            <ul>
              {product.notYet.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </section>
      </article>

      <nav className="devprod__nextprev" aria-label="More products">
        <Link className="devpage__back" href="/products">
          <ArrowLeft size={13} aria-hidden="true" /> All products
        </Link>
        <Link className="devpage__back" href={`/products/${next.slug}`}>
          Next: {next.name} <ArrowUpRight size={13} aria-hidden="true" />
        </Link>
      </nav>
    </DevShell>
  );
}
