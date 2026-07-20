import Image from "next/image";

export default function CompanionKoiArt({ id, className = "" }: { id: string; className?: string }) {
  return (
    <span
      className={`koi-companion-art ${className}`}
      aria-hidden="true"
      data-art-id={id}
      data-companion-koi-art=""
    >
      <Image
        className="koi-companion-art__image"
        src="/brand/koinophobia-labs-koi-640.webp"
        alt=""
        width={640}
        height={640}
        sizes="(max-width: 760px) 62px, 70px"
        draggable={false}
      />
      <span className="koi-companion-art__glow" />
    </span>
  );
}
