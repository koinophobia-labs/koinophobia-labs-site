import type { LucideIcon } from "lucide-react";
import {
  BriefcaseBusiness,
  Building2,
  CircleDollarSign,
  GitBranch,
  IdCard,
  Mail,
  Rocket,
} from "lucide-react";

export const founderLinks = {
  email: "mailto:koinophobia999@gmail.com",
  emailWithContext:
    "mailto:koinophobia999@gmail.com?subject=Following%20up%20with%20Blake&body=Where%20we%20met%3A%0AWhat%20I%27m%20building%3A%0ALooking%20for%3A%20website%20audit%20%2F%20product%20help%20%2F%20career%20or%20startup%20conversation%0A",
  github: "https://github.com/koinophobia-labs",
  linkedin: "https://linkedin.com/in/bt77",
  labs: "https://koinophobialabs.com/#contact",
} as const;

export const primaryActions: Array<{
  label: string;
  href: string;
  icon: LucideIcon;
  tone: "gold" | "cyan" | "orange" | "ghost";
  external?: boolean;
}> = [
  {
    label: "Get a $250 Website Revenue Leak Audit",
    href: "/audit",
    icon: CircleDollarSign,
    tone: "gold",
  },
  {
    label: "Work with Koinophobia Labs",
    href: founderLinks.labs,
    icon: Building2,
    tone: "cyan",
    external: true,
  },
  {
    label: "See Trendi",
    href: "/trendi",
    icon: Rocket,
    tone: "orange",
  },
  {
    label: "View Career / Resume",
    href: "/resume",
    icon: BriefcaseBusiness,
    tone: "ghost",
  },
  {
    label: "LinkedIn",
    href: founderLinks.linkedin,
    icon: IdCard,
    tone: "ghost",
    external: true,
  },
  {
    label: "GitHub",
    href: founderLinks.github,
    icon: GitBranch,
    tone: "ghost",
    external: true,
  },
  {
    label: "Email Blake",
    href: founderLinks.emailWithContext,
    icon: Mail,
    tone: "ghost",
  },
];

export const buildCards = [
  {
    title: "Trendi",
    tag: "PRODUCT PROOF",
    body:
      "Creator consistency app helping people figure out what to post, draft content, and stay consistent. Current public page treats it as product proof, not a public launch claim.",
    href: "/trendi",
  },
  {
    title: "Koinophobia Labs Revenue Leak Audit",
    tag: "$250 OFFER",
    body:
      "A focused website audit for local businesses that finds trust gaps, mobile friction, unclear CTAs, booking or inquiry problems, and missed conversion paths.",
    href: "/audit",
  },
  {
    title: "You Know Ball",
    tag: "WEB MVP",
    body:
      "Sports debate game and proof asset where users defend takes, get judged, and prove they know ball. Treated here as an MVP and product proof asset.",
    href: "https://you-know-ball-orpin.vercel.app",
  },
  {
    title: "Career Forge",
    tag: "CAREER TOOL",
    body:
      "Career, resume, and product-positioning tool focused on turning real experience into clearer role language without invented credentials.",
    href: "/resume",
  },
  {
    title: "Koi Cave",
    tag: "SYSTEMS PROOF",
    body:
      "Founder operating system and agent command center for approvals, memory, receipts, and execution. Proof of systems thinking, not a public SaaS claim.",
  },
];

export const reachOutReasons = [
  "You run a local business and want your website to convert better.",
  "You are a founder or creator who needs a sharper launch system.",
  "You are hiring for product, AI, community, operations, support, or startup roles.",
  "We met at a Chicago tech/startup event and should keep the thread alive.",
];

export const auditReviewAreas = [
  "Trust and credibility gaps",
  "Homepage clarity and offer positioning",
  "Mobile flow and tap friction",
  "Booking, inquiry, or contact path issues",
  "CTA visibility and conversion friction",
  "Missed revenue opportunities in the current site",
];
