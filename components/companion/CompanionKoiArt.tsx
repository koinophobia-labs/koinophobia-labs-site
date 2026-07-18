import { TrendiFishBody, TrendiFishDefs } from "@/components/trendi/TrendiFish";

const companionPalette = ["#f1eaff", "#c9a7ff", "#a66cff", "#6840bc"] as const;

export default function CompanionKoiArt({ id, className = "" }: { id: string; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 307 596"
      aria-hidden="true"
      focusable="false"
      data-companion-koi-art=""
    >
      <defs><TrendiFishDefs id={id} colors={companionPalette} /></defs>
      <TrendiFishBody id={id} className="koi-companion-art__body" />
    </svg>
  );
}
