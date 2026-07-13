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
  { label: "Connect on LinkedIn", href: founderLinks.linkedin, icon: IdCard, tone: "gold", external: true },
  { label: "View Résumé", href: founderLinks.resume, icon: BriefcaseBusiness, tone: "outline-gold" },
  { label: "Email Blake", href: founderLinks.emailWithContext, icon: Mail, tone: "cyan" },
  { label: "Koinophobia Labs", href: founderLinks.labs, icon: Building2, tone: "ghost", external: true },
  { label: "GitHub", href: founderLinks.github, icon: GitBranch, tone: "ghost", external: true },
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
    tag: "LEVERAGE FOR CREATORS",
    body: "Turns a rough thought into clear words to say on camera, reducing the friction between having an idea and publishing it.",
    href: founderLinks.trendi,
    cta: "View Trendi",
  },
  {
    title: "Career Forge",
    tag: "LEVERAGE FOR JOB SEEKERS",
    body: "Turns a scattered career transition into a repeatable operation for positioning, applications, outreach, and interviews.",
    href: founderLinks.careerForge,
    cta: "Open Career Forge",
    external: true,
  },
  {
    title: "Website Revenue Leak Audit",
    tag: "LEVERAGE FOR BUSINESSES",
    body: "Turns vague website problems into a prioritized map of trust gaps, mobile friction, and missed inquiry paths.",
    href: founderLinks.audit,
    cta: "View the audit",
  },
  {
    title: "Career / Résumé",
    tag: "THE OPERATOR BEHIND THE SYSTEMS",
    body: "The operations, customer experience, trust and safety, and product background behind the studio’s systems mindset.",
    href: founderLinks.resume,
    cta: "View résumé",
  },
];

export const reachOutReasons = [
  "Turn a messy workflow into a repeatable system",
  "Build a product or website that removes friction",
  "Solve product, operations, or customer-experience problems",
];

export const auditReviewAreas = [
  "Trust and credibility gaps",
  "Homepage clarity and offer positioning",
  "Mobile flow and tap friction",
  "Booking, inquiry, or contact path issues",
  "CTA visibility and conversion friction",
  "Missed revenue opportunities in the current site",
];
