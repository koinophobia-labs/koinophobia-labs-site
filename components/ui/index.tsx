"use client";

import clsx from "clsx";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

type ButtonProps = ComponentProps<"a"> & {
  tone?: "gold" | "cyan" | "orange" | "ghost";
  soon?: boolean;
};

export function Button({
  tone = "gold",
  className,
  children,
  soon,
  ...props
}: ButtonProps) {
  return (
    <a className={clsx("btn", `btn-${tone}`, className)} {...props}>
      <span>{children}</span>
      {soon ? <em>SOON</em> : null}
    </a>
  );
}

export function Kicker({
  children,
  tone = "cyan",
}: {
  children: ReactNode;
  tone?: "cyan" | "gold" | "orange";
}) {
  return <p className={clsx("kicker", `kicker-${tone}`)}>{children}</p>;
}

export function Mark({ children }: { children: ReactNode }) {
  return <span className="mark">{children}</span>;
}

export function Chip({
  children,
  tone = "cyan",
}: {
  children: ReactNode;
  tone?: "cyan" | "gold" | "orange" | "gray" | "magenta";
}) {
  return <span className={clsx("chip", `chip-${tone}`)}>{children}</span>;
}

export function StatusTag({
  children,
  tone = "cyan",
}: {
  children: ReactNode;
  tone?: "cyan" | "gold" | "orange" | "gray" | "magenta";
}) {
  return <span className={clsx("status-tag", `status-${tone}`)}>{children}</span>;
}

export function SectionHead({
  kicker,
  index,
  title,
  children,
  tone = "cyan",
}: {
  kicker: ReactNode;
  index?: string;
  title: ReactNode;
  children: ReactNode;
  tone?: "cyan" | "gold" | "orange";
}) {
  return (
    <div className="section-head">
      <div>
        <Kicker tone={tone}>{kicker}</Kicker>
        <h2>{title}</h2>
      </div>
      {index ? <span className="section-index">{index}</span> : null}
      <p>{children}</p>
    </div>
  );
}

export function Reveal({
  children,
  className,
  delay = 0,
  direction = "up",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right" | "scale";
}) {
  const reduced = useReducedMotion();
  const offsets = {
    up: { y: 28, x: 0, scale: 1 },
    left: { y: 0, x: -28, scale: 1 },
    right: { y: 0, x: 28, scale: 1 },
    scale: { y: 12, x: 0, scale: 0.97 },
  };

  if (reduced) return <div className={clsx("reveal", className)}>{children}</div>;

  return (
    <motion.div
      className={clsx("reveal", className)}
      initial={{ opacity: 0, ...offsets[direction] }}
      whileInView={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      viewport={{ once: true, margin: "-12% 0px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function Receipt({
  children,
  verified = true,
}: {
  children: ReactNode;
  verified?: boolean;
}) {
  return (
    <span className={clsx("receipt", verified && "receipt-on")}>
      <CheckCircle2 size={14} aria-hidden="true" />
      {children}
    </span>
  );
}

