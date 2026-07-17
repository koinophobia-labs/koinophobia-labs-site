import clsx from "clsx";
import Image from "next/image";

type BrandLogoVariant = "emblem" | "lockup";

type BrandLogoProps = {
  variant?: BrandLogoVariant;
  className?: string;
  priority?: boolean;
  animated?: boolean;
  decorative?: boolean;
};

const ASSETS: Record<
  BrandLogoVariant,
  { src: string; width: number; height: number }
> = {
  emblem: {
    src: "/brand/koi-emblem.svg",
    width: 800,
    height: 800,
  },
  lockup: {
    src: "/brand/koinophobia-lockup.svg",
    width: 1600,
    height: 420,
  },
};

export default function BrandLogo({
  variant = "emblem",
  className,
  priority = false,
  animated = false,
  decorative = false,
}: BrandLogoProps) {
  const asset = ASSETS[variant];

  return (
    <span
      className={clsx(
        "brand-logo",
        `brand-logo--${variant}`,
        animated && "brand-logo--pulse",
        className,
      )}
      aria-hidden={decorative ? true : undefined}
      data-brand-logo={variant}
    >
      <Image
        src={asset.src}
        width={asset.width}
        height={asset.height}
        alt={decorative ? "" : "Koinophobia Labs"}
        priority={priority}
        unoptimized
      />
    </span>
  );
}
