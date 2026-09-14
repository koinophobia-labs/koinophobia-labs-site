import Link from "next/link";
import AppStoreBadge, { type Placement } from "@/components/site/AppStoreBadge";
import type { SiteProduct } from "@/lib/products";

export function DeviceFrame({ src, alt, priority }: { src: string; alt: string; priority?: boolean }) {
  return (
    <div className="device">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} width={600} height={1304} loading={priority ? "eager" : "lazy"} decoding="async" />
    </div>
  );
}

/**
 * A shipped product on a real screen. The whole card links to the product
 * page; the App Store badge is its own link and stops propagation.
 */
export function ProductCard({
  product,
  index = 0,
  placement,
  showNotYet = false,
}: {
  product: SiteProduct;
  index?: number;
  placement: Placement;
  showNotYet?: boolean;
}) {
  const screen = product.screens[0];
  // A stretched link covers the card; the App Store badge sits above it as
  // its own anchor. Two links, never nested, both keyboard-reachable.
  return (
    <article className="pcard s" style={{ "--i": index } as React.CSSProperties} data-tilt>
      <Link
        className="pcard__cover"
        href={product.href}
        aria-label={`${product.name}: ${product.blurb}`}
      />
      {screen ? <DeviceFrame src={screen.src} alt={screen.alt} /> : null}
      <div className="pcard__txt">
        <span className="pcard__meta">
          <span className="chip chip--live">{product.platforms}</span>
          <span className="chip">{product.chip}</span>
        </span>
        <h3>{product.name}</h3>
        <p>{product.blurb}</p>
        {showNotYet ? <span className="pcard__notyet">{product.notYetShort}</span> : null}
        <span className="pcard__go">
          {product.appStore ? (
            <AppStoreBadge product={product.slug} url={product.appStore.url} placement={placement} />
          ) : null}
          {product.appStore ? (
            <span className="pcard__ver">
              v{product.appStore.version} · verified {product.appStore.verifiedAt}
            </span>
          ) : null}
        </span>
      </div>
    </article>
  );
}

/** An experiment at its real stage. No device, one violet chip, one receipt. */
export function LabCard({ product, index = 0 }: { product: SiteProduct; index?: number }) {
  const external = /^https?:/.test(product.href);
  const inner = (
    <>
      <span className="lcard__top">
        <h3>{product.name}</h3>
        <span className="chip chip--lab">{product.chip}</span>
      </span>
      <p>{product.blurb}</p>
      {product.receipt ? <span className="receipt receipt--lab">{product.receipt}</span> : null}
    </>
  );
  const style = { "--i": index } as React.CSSProperties;
  return external ? (
    <a className="lcard s ai" href={product.href} target="_blank" rel="noreferrer" style={style} data-analytics="testflight_click" data-analytics-label={product.slug}>
      {inner}
    </a>
  ) : (
    <Link className="lcard s ai" href={product.href} style={style} data-analytics="lab_card_click" data-analytics-label={product.slug}>
      {inner}
    </Link>
  );
}
