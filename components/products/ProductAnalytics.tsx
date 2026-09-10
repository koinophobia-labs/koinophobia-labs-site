"use client";

import { useEffect } from "react";
import { track } from "@vercel/analytics";

export type ProductId = "trendi" | "forget-about-it" | "way-in";

export function ProductPageView({ product, surface = "product" }: { product: ProductId; surface?: "product" | "story" }) {
  useEffect(() => {
    track("product_page_view", { product, surface });
  }, [product, surface]);
  return null;
}

export function AppStoreLink({ product, placement, href, className, id }: {
  product: ProductId;
  placement: "nav" | "hero" | "footer" | "story";
  href: string;
  className?: string;
  id?: string;
}) {
  return <a id={id} className={className} href={href}
    onClick={() => track("app_store_click", { product, placement })}>
    Download on the App Store <span aria-hidden="true">↗</span>
  </a>;
}
