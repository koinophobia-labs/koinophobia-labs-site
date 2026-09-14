import type { Metadata } from "next";
import LabPage from "@/components/site/LabPage";
import { getSiteProduct } from "@/lib/products";
import { STUDIO_URL, socialCard } from "@/lib/seo";

export const metadata: Metadata = {
  title: "KOI",
  description:
    "A language model taught to read from random weights on a laptop. The tokenizer, transformer, training loop, and inference server are all the studio's own code. It is not useful yet; that is the thing being measured.",
  alternates: { canonical: `${STUDIO_URL}/lab/koi` },
  openGraph: { url: `${STUDIO_URL}/lab/koi`, images: [socialCard("Teaching a model to read, from random weights, on a laptop.", "The lab")] },
};

export default function KoiPage() {
  const product = getSiteProduct("koi")!;
  return (
    <LabPage
      product={product}
      kicker="KOI · Research · a language model from nothing"
      h1="Teaching a model to read, from random weights, on a laptop."
      lede="KOI is not a fine-tune and not a wrapper. The tokenizer, the transformer, the training loop, and the local inference server are all the studio's own code, and the weights started as noise. The corpus is one the studio owns. The question being asked is small and exact: what does a model this size actually learn, and how would you know?"
      stats={[
        { value: "869,504", label: "parameters in koi-0.1" },
        { value: "1,500 steps", label: "in 75 s on an M4" },
        { value: "2.11", label: "held-out perplexity" },
        { value: "298", label: "commits" },
        { value: "25", label: "versioned verdicts" },
      ]}
      plate={{
        src: "/koi/koi-afterimage-1280.mp4",
        poster: "/koi/poster-afterimage.webp",
        caption: "H5 · the electric after-image, generated 2026-09-14 from the studio's koi. Atmosphere, not evidence.",
      }}
      sections={[
        {
          kicker: "What it has not learned",
          title: "Most experiments end in a verdict of REJECTED, and every rejection is a receipt.",
          body: (
            <>
              <p className="lede">
                Long-range agent closure: 0.12 against a 0.10 baseline. Not learned.
                Free-generation format validity: 0.00. Not learned. Verbatim echo: failed; the copy
                wall is characterised.
              </p>
              <p className="voice">&ldquo;It is not useful yet. That is the next milestone, not this one.&rdquo;</p>
            </>
          ),
        },
        {
          kicker: "How it's run",
          title: "Eighteen lanes, one baseline, one GPU.",
          body: (
            <p className="lede">
              Eighteen experiment lanes as git worktrees, one certified integration baseline, one
              heavy job at a time because the machine has one GPU. Seventy-six receipt files for
              the third epoch. A falsifier that reverts a change when the bar isn&apos;t cleared:
              the latest commit reads &ldquo;MORPH-1 VERDICT: bar FAILED at diagnose 5/8, reverted
              per the rule.&rdquo;
            </p>
          ),
        },
      ]}
      next="Characterise the 30-million-parameter variant on the same falsifier, and publish the first run whose free generation is well-formed, if one appears."
    />
  );
}
