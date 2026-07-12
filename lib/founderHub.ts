import type { LucideIcon } from "lucide-react";
import { BriefcaseBusiness, Building2, GitBranch, IdCard, Mail } from "lucide-react";
import { LINKS } from "@/lib/links";

export const founderLinks = {
  audit: "/audit",
  careerForge: LINKS.careerForge,
  email: LINKS.email,
  emailWithContext:
    "mailto:koinophobia999@gmail.com?subject=Following%20up%20with%20Blake&body=Where%20we%20met%3A%0AWhat%20I%27m%20building%3A%0ALooking%20for%3A%20website%20audit%20%2F%20product%20help%20%2F%20career%20or%20startup%20conversation%0A",
  github: LINKS.github,
  labs: LINKS.labs,
  linkedin: LINKS.linkedin,
  resume: "/resume",
  trendi: "/trendi",
} as const;

export const primaryActions: Array<{
  label: string;
  href: string;
  icon: LucideIcon;
  tone: "gold" | "outline-gold" | "cyan" | "orange" | "ghost";
  external?: boolean;
}> = [
  {
    label: "Connect on LinkedIn",
    href: founderLinks.linkedin,
    icon: IdCard,
    tone: "gold",
    external: true,
  },
  {
    label: "View Résumé",
    href: founderLinks.resume,
    icon: BriefcaseBusiness,
    tone: "outline-gold",
  },
  {
    label: "Email Blake",
    href: founderLinks.emailWithContext,
    icon: Mail,
    tone: "cyan",
  },
  {
    label: "Koinophobia Labs",
    href: founderLinks.labs,
    icon: Building2,
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
];

export const buildCards: Array<{
  title: string;
  tag: string;
  body: string;
  href: string;
  cta: string;
  external?: boolean;
}> = [
  {
    title: "Trendi",
    tag: "AI PRODUCT",
    body:
      "A creator tool that turns a rough thought into clear words to say on camera.",
    href: founderLinks.trendi,
    cta: "View Trendi",
  },
  {
    title: "Career Forge",
    tag: "LIVE TOOL",
    body:
      "A local-first command center for positioning, resumes, applications, outreach, and interview prep.",
    href: founderLinks.careerForge,
    cta: "Open Career Forge",
    external: true,
  },
  {
    title: "Website Audit",
    tag: "CLIENT WORK",
    body:
      "A focused review of trust, mobile friction, unclear calls to action, and missed inquiry paths.",
    href: founderLinks.audit,
    cta: "View the audit",
  },
  {
    title: "Career / Résumé",
    tag: "BACKGROUND",
    body:
      "A concise view of Blake’s experience, target role lanes, LinkedIn, GitHub, and contact details.",
    href: founderLinks.resume,
    cta: "View résumé",
  },
];

export const reachOutReasons = [
  "AI products and practical automation",
  "Websites and conversion-focused systems",
  "Product, operations, and technical customer work",
];

export const auditReviewAreas = [
  "Trust and credibility gaps",
  "Homepage clarity and offer positioning",
  "Mobile flow and tap friction",
  "Booking, inquiry, or contact path issues",
  "CTA visibility and conversion friction",
  "Missed revenue opportunities in the current site",
];
