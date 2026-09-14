"use client";

import { track } from "@vercel/analytics";
import type { MouseEvent } from "react";

export type Placement = "home" | "shipped" | "product_hero" | "product_end" | "mobile_row" | "lab";

/**
 * The link people trust. Always the store URL, always a new tab, always
 * tracked. Stops propagation so it can live inside a card that is itself a
 * link. The price line under it comes from the listing, never a guess.
 */
export default function AppStoreBadge({
  product,
  url,
  placement,
  priceLine,
  version,
}: {
  product: string;
  url: string;
  placement: Placement;
  priceLine?: string;
  version?: string;
}) {
  const onClick = (event: MouseEvent) => {
    event.stopPropagation();
    track("app_store_click", { product, placement });
  };
  return (
    <span className="store">
      <a
        className="store__badge ai"
        href={url}
        target="_blank"
        rel="noreferrer"
        onClick={onClick}
        aria-label={`Download ${product} on the App Store`}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
          <path d="M12 3a1 1 0 0 1 1 1v8.59l2.3-2.3a1 1 0 1 1 1.4 1.42l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.42l2.3 2.3V4a1 1 0 0 1 1-1Zm-7 14a1 1 0 0 1 1 1v1h12v-1a1 1 0 1 1 2 0v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1Z" />
        </svg>
        <span>
          <small>Download on the</small>
          <span>App Store</span>
        </span>
      </a>
      {priceLine ? (
        <span className="store__price">
          {priceLine}
          {version ? ` · v${version}` : ""}
        </span>
      ) : null}
    </span>
  );
}
