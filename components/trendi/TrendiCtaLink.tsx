"use client";

import type { ComponentProps } from "react";
import { trackTrendiHero } from "@/lib/trendiHero";

/**
 * The hero's primary CTA. Identical markup to a plain anchor — it only adds
 * the trendi_hero_cta_clicked analytics event, following the dataLayer
 * convention in lib/youKnowBall.ts.
 */
export default function TrendiCtaLink(props: ComponentProps<"a">) {
  return (
    <a
      {...props}
      onClick={(event) => {
        trackTrendiHero("hero_cta_clicked");
        props.onClick?.(event);
      }}
    />
  );
}
