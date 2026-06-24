"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Radio } from "lucide-react";
import { proofReceipts } from "@/lib/content";
import { Button, Reveal, SectionHead } from "@/components/ui";

export default function ProofOfWork() {
  const [verified, setVerified] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const timer = window.setTimeout(() => setVerified(proofReceipts.length), 0);
      return () => window.clearTimeout(timer);
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        proofReceipts.forEach((_, index) => {
          window.setTimeout(() => setVerified(index + 1), index * 150);
        });
        observer.disconnect();
      },
      { threshold: 0.25 },
    );
    if (panelRef.current) observer.observe(panelRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="proof" className="section" aria-labelledby="proof-title">
      <Reveal>
        <SectionHead
          kicker="Shipping log · live"
          index="// PROOF_OF_WORK"
          title={
            <>
              Proof of <span className="mark">work</span>.
            </>
          }
        >
          Not vague bragging — a shipping log. Concrete receipts behind the
          products: built, deployed, gated, and red-teamed.
        </SectionHead>
      </Reveal>
      <Reveal>
        <div className="proof-panel panel" ref={panelRef}>
          <header>
            <strong>koi://receipts.log</strong>
            <span>{String(verified).padStart(2, "0")} / 11 VERIFIED</span>
          </header>
          <div className="proof-rows">
            {proofReceipts.map((receipt, index) => {
              const on = verified > index;
              return (
                <article key={receipt.title} className={on ? "verified" : ""}>
                  <span className="check-box">
                    {on ? <Check size={15} /> : null}
                  </span>
                  <div>
                    <h3>{receipt.title}</h3>
                    <p>{receipt.description}</p>
                  </div>
                  {receipt.metric ? <strong className="metric">{receipt.metric}</strong> : null}
                  <em>{receipt.tag}</em>
                </article>
              );
            })}
          </div>
          <footer>
            <span>
              <Radio size={15} /> LIVE LED · receipts updating as the panel comes online.
            </span>
            <Button href="#contact" tone="ghost">
              Work with me
            </Button>
          </footer>
        </div>
      </Reveal>
    </section>
  );
}
