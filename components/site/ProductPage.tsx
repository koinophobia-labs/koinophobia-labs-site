import Link from "next/link";
import { ArrowRight } from "lucide-react";
import AppStoreBadge from "@/components/site/AppStoreBadge";
import { DeviceFrame } from "@/components/site/Cards";
import DemoClip from "@/components/site/DemoClip";
import Masthead from "@/components/site/Masthead";
import { ProductPageView, type ProductId } from "@/components/products/ProductAnalytics";
import SiteFooter from "@/components/site/SiteFooter";
import StickyStart from "@/components/site/StickyStart";
import { stageLabel } from "@/lib/dev/universe";
import type { SiteProduct } from "@/lib/products";

/**
 * One template for the three shipped apps. Problem, insight, the product,
 * one key interaction on film, a decision that hurt, status and limits, the
 * badge. Every fact comes from the registry; the page adds no claim of its
 * own. See the rebuild document, sections 4 and 7.
 */
export default function ProductPage({ product, analyticsId }: { product: SiteProduct; analyticsId: ProductId }) {
  const page = product.page!;
  const store = product.appStore!;
  const hero = product.screens[0];
  const decision = product.decisions[0];

  return (
    <div className="site" data-motion-shell>
      <ProductPageView product={analyticsId} />
      <Masthead current="/shipped" />
      <main className="shell page">
        <section className="phero" aria-labelledby="product-title">
          <div className="phero__copy">
            <p className="k s">
              <b>Shipped</b> · {page.kicker}
            </p>
            <h1 id="product-title" className="s" style={{ "--i": 1 } as React.CSSProperties}>
              {page.h1}
            </h1>
            <p className="lede s" style={{ "--i": 2 } as React.CSSProperties}>
              {page.lede}
            </p>
            <div className="actions s" style={{ "--i": 3 } as React.CSSProperties}>
              <AppStoreBadge product={product.slug} url={store.url} placement="product_hero" priceLine={store.priceLine} version={store.version} />
              {product.demo ? (
                <a className="btn ai" href="#demo">
                  Watch it work · {product.demo.seconds} s
                </a>
              ) : null}
              {page.secondaryAction ? (
                page.secondaryAction.external ? (
                  <a className="btn ai" href={page.secondaryAction.href} target="_blank" rel="noreferrer">
                    {page.secondaryAction.label}
                  </a>
                ) : (
                  <Link className="btn ai" href={page.secondaryAction.href}>
                    {page.secondaryAction.label}
                  </Link>
                )
              ) : null}
            </div>
            <div className="rail s" style={{ "--i": 4 } as React.CSSProperties}>
              <span>
                <b>{product.platforms}</b>
              </span>
              <span>
                <b>{stageLabel[product.stage]}</b>
              </span>
              <span>
                <b>Verified</b> {product.verifiedAt}
              </span>
            </div>
          </div>
          {hero ? (
            <div className="s" data-tilt style={{ "--i": 2 } as React.CSSProperties}>
              <DeviceFrame src={hero.src} alt={hero.alt} priority />
            </div>
          ) : null}
        </section>

        <section className="sec" aria-labelledby="problem-title">
          <p className="k s">The problem</p>
          <h2 id="problem-title" className="s" style={{ "--i": 1 } as React.CSSProperties}>
            {page.insightTitle}
          </h2>
          <p className="lede s" style={{ "--i": 2 } as React.CSSProperties}>
            {page.insightBody}
          </p>
        </section>

        <section className="sec" aria-labelledby="product-blocks-title">
          <p className="k s">The product</p>
          <h2 id="product-blocks-title" className="s" style={{ "--i": 1 } as React.CSSProperties}>
            What it actually does.
          </h2>
          <div className="pblocks">
            {page.blocks.map((block, index) => (
              <div className="pblock s" key={block.title} style={{ "--i": index } as React.CSSProperties}>
                <h3>{block.title}</h3>
                <p>{block.body}</p>
              </div>
            ))}
          </div>
        </section>

        {product.demo ? (
          <section className="sec" id="demo" aria-labelledby="demo-title">
            <p className="k s">The key interaction</p>
            <h2 id="demo-title" className="s" style={{ "--i": 1 } as React.CSSProperties}>
              Real screen, real result, {product.demo.seconds} seconds.
            </h2>
            <div className="s" style={{ "--i": 2 } as React.CSSProperties}>
              <DemoClip product={product} />
            </div>
          </section>
        ) : null}

        {product.screens.length > 1 ? (
          <section className="sec" aria-labelledby="screens-title">
            <p className="k s">From the App Store listing</p>
            <h2 id="screens-title" className="s" style={{ "--i": 1 } as React.CSSProperties}>
              The screens, unretouched.
            </h2>
            <div className="screens">
              {product.screens.map((screen, index) => (
                <figure className="s" key={screen.src} style={{ "--i": index } as React.CSSProperties}>
                  <DeviceFrame src={screen.src} alt={screen.alt} />
                  <figcaption>{screen.alt}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        ) : null}

        {decision ? (
          <section className="sec" aria-labelledby="decision-title">
            <p className="k s">A decision that hurt</p>
            <h2 id="decision-title" className="s" style={{ "--i": 1 } as React.CSSProperties}>
              {decision.call}
            </h2>
            <p className="voice s" style={{ "--i": 2 } as React.CSSProperties}>
              &ldquo;{decision.why}&rdquo;
            </p>
          </section>
        ) : null}

        <section className="sec" aria-labelledby="status-title">
          <p className="k s">Status and limits</p>
          <h2 id="status-title" className="s" style={{ "--i": 1 } as React.CSSProperties}>
            {product.status}.
          </h2>
          <p className="lede s" style={{ "--i": 2 } as React.CSSProperties}>
            {page.statusBody}
          </p>
          <ul className="notyet s" style={{ "--i": 3 } as React.CSSProperties} aria-label="Not yet">
            {product.notYet.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <ul className="evidence s" style={{ "--i": 4 } as React.CSSProperties} aria-label="Evidence">
            {product.evidence.map((item) => (
              <li key={item.claim}>
                <b>{item.claim}</b>
                {item.source}
              </li>
            ))}
          </ul>
        </section>

        <section className="sec glass" aria-labelledby="end-title">
          <h2 id="end-title" className="s">
            {product.name}. On your phone in a minute.
          </h2>
          <div className="actions s" style={{ "--i": 1 } as React.CSSProperties}>
            <AppStoreBadge product={product.slug} url={store.url} placement="product_end" priceLine={store.priceLine} />
            <Link className="btn ai" href="/work-with-me">
              Build something like this <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </section>

        <SiteFooter />
      </main>
      <StickyStart after="demo" />
    </div>
  );
}
