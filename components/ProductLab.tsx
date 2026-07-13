"use client";

import clsx from "clsx";
import { useState } from "react";
import { productModules } from "@/lib/content";
import { useIsNarrow } from "@/lib/hooks";
import { Button, Chip, Reveal, SectionHead, StatusTag } from "@/components/ui";

type Tone = "cyan" | "gold" | "orange" | "gray" | "magenta";
type ButtonTone = "cyan" | "gold" | "orange" | "ghost";

function buttonTone(tone: string): ButtonTone {
  if (tone === "orange" || tone === "gold") return tone;
  return "cyan";
}

function externalProps(href: string) {
  return href.startsWith("http") ? { target: "_blank", rel: "noopener" } : {};
}

function Dossier({ index }: { index: number }) {
  const item = productModules[index];
  return (
    <div className="dossier" key={item.name}>
      <div className="dossier-grid">
        <div>
          <span>What it is</span>
          <p>{item.what}</p>
        </div>
        <div>
          <span>Who it&apos;s for</span>
          <p>{item.who}</p>
        </div>
        <div>
          <span>Why it matters</span>
          <p>{item.why}</p>
        </div>
      </div>
      <div className="chip-row">
        {item.receipts.map((receipt) => (
          <Chip key={receipt} tone={item.tone as Tone}>
            {receipt}
          </Chip>
        ))}
      </div>
      <div className="cta-row">
        <Button href={item.href} tone={buttonTone(item.tone)} {...externalProps(item.href)}>
          {item.cta} →
        </Button>
        {item.secondaryHref ? (
          <Button href={item.secondaryHref} tone="ghost" {...externalProps(item.secondaryHref)}>
            {item.secondaryCta} →
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export default function ProductLab() {
  const [selected, setSelected] = useState(0);
  const isNarrow = useIsNarrow(900);

  return (
    <section id="lab" className="section" aria-labelledby="lab-title">
      <Reveal>
        <SectionHead
          kicker="Active modules · 05"
          index="// PRODUCT_LAB"
          title="Product Lab"
        >
          Five products in active rotation. Select a module to open its dossier
          — what it is, who it&apos;s for, and why it exists.
        </SectionHead>
      </Reveal>
      <Reveal>
        <div className="lab-console panel">
          <div className="module-list" role="list">
            {productModules.map((item, index) => (
              <div key={item.name} className="module-wrap" role="listitem">
                <button
                  type="button"
                  className={clsx("module-row", selected === index && "active")}
                  onClick={() => setSelected(index)}
                  aria-expanded={isNarrow ? selected === index : undefined}
                >
                  <span className={clsx("led", `led-${item.tone}`)} />
                  <strong>{item.name}</strong>
                  <StatusTag tone={item.tone as Tone}>{item.status}</StatusTag>
                </button>
                {isNarrow && selected === index ? <Dossier index={index} /> : null}
              </div>
            ))}
          </div>
          {!isNarrow ? <Dossier index={selected} /> : null}
        </div>
      </Reveal>
    </section>
  );
}
