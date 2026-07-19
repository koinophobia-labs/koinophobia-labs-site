import type { CompanionRouteKey } from "@/lib/companion/site-knowledge";

export type CompanionAction = {
  id: "concierge" | "intake" | "services" | "human_review";
  label: string;
  href?: string;
};

// Page-copilot surfaces the panel can open in place (audit U4). Distinct per
// route so the assistant is genuinely page-aware, not a fixed launcher.
export type CopilotIntent = "understand" | "compare" | "relevant_work" | "next_step";

export type CompanionPageContext = {
  routeKey: CompanionRouteKey | "suppressed";
  enabled: boolean;
  invitation?: string;
  actions: CompanionAction[];
  copilot: CopilotIntent[];
  /** Concrete slug for work-detail / demo routes, so the panel can ground answers. */
  slug?: string;
  preferredSide: "left" | "right";
  invitationDelayMs: number;
};

const baseActions: CompanionAction[] = [
  { id: "concierge", label: "Help me figure out what I need" },
  { id: "intake", label: "Start a project", href: "/intake" },
  { id: "services", label: "Explore services", href: "/services" },
  { id: "human_review", label: "Ask for a human scope review", href: "/intake?service=Not%20sure%20yet" },
];

const disabled: CompanionPageContext = {
  routeKey: "suppressed",
  enabled: false,
  actions: [],
  copilot: [],
  preferredSide: "right",
  invitationDelayMs: 0,
};

type ExactContext = Omit<CompanionPageContext, "enabled" | "actions" | "copilot"> & {
  actions?: CompanionAction[];
  copilot: CopilotIntent[];
};

const exactContexts: Record<string, ExactContext> = {
  "/": {
    routeKey: "home",
    invitation: "Not sure where to start?",
    copilot: ["understand", "compare", "next_step"],
    preferredSide: "right",
    invitationDelayMs: 6_000,
  },
  "/services": {
    routeKey: "services",
    invitation: "I can help match the problem to a service.",
    copilot: ["understand", "compare", "next_step"],
    preferredSide: "right",
    invitationDelayMs: 6_000,
  },
  "/work": {
    routeKey: "work",
    invitation: "Want to find the closest fit for your project?",
    copilot: ["understand", "relevant_work", "next_step"],
    preferredSide: "left",
    invitationDelayMs: 8_000,
  },
  "/products": {
    routeKey: "products",
    invitation: "Looking for something built around your business?",
    copilot: ["understand", "next_step"],
    preferredSide: "right",
    invitationDelayMs: 8_000,
  },
  "/process": {
    routeKey: "process",
    invitation: "I can help turn the process into a practical first step.",
    copilot: ["understand", "next_step"],
    preferredSide: "right",
    invitationDelayMs: 9_000,
  },
  "/about": {
    routeKey: "about",
    invitation: "Want Blake to review the shape of your project?",
    copilot: ["understand", "next_step"],
    preferredSide: "right",
    invitationDelayMs: 9_000,
  },
  "/audit": {
    routeKey: "audit",
    invitation: "Unsure whether you need an audit or a build?",
    copilot: ["understand", "compare", "next_step"],
    preferredSide: "left",
    invitationDelayMs: 7_000,
  },
  "/revenue-leak-audit": {
    routeKey: "audit",
    invitation: "Unsure whether you need an audit or a build?",
    copilot: ["understand", "compare", "next_step"],
    preferredSide: "left",
    invitationDelayMs: 7_000,
  },
  "/intake": {
    routeKey: "intake",
    invitation: "I can help organize the project before you submit.",
    copilot: ["understand", "next_step"],
    preferredSide: "left",
    invitationDelayMs: 9_000,
    actions: [
      { id: "concierge", label: "Help me organize the project" },
      { id: "intake", label: "Continue with the standard form", href: "/intake#standard-intake" },
      { id: "services", label: "Review services first", href: "/services" },
      { id: "human_review", label: "Ask for a human scope review", href: "/intake?service=Not%20sure%20yet" },
    ],
  },
};

const suppressedPrefixes = [
  "/api",
  "/brand",
  "/concierge",
  "/connect",
  "/crm",
  "/home",
  "/now",
  "/payment",
  "/resume",
  "/trendi",
  "/you-know-ball",
] as const;

export function resolveCompanionPageContext(pathname: string): CompanionPageContext {
  const path = pathname.split(/[?#]/, 1)[0] || "/";
  if (suppressedPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) return disabled;

  const exact = exactContexts[path];
  if (exact) return { ...exact, enabled: true, actions: exact.actions || baseActions };

  if (path.startsWith("/work/")) {
    return {
      routeKey: "work_detail",
      enabled: true,
      invitation: "Does this feel close to what your business needs?",
      actions: baseActions,
      copilot: ["understand", "relevant_work", "next_step"],
      slug: path.slice("/work/".length).split("/", 1)[0] || undefined,
      preferredSide: "left",
      invitationDelayMs: 9_000,
    };
  }

  if (path.startsWith("/demos/")) {
    return {
      routeKey: "demo",
      enabled: true,
      invitation: "Want to map this kind of experience to your business?",
      actions: baseActions,
      copilot: ["understand", "relevant_work", "next_step"],
      slug: path.slice("/demos/".length).split("/", 1)[0] || undefined,
      preferredSide: "right",
      invitationDelayMs: 9_000,
    };
  }

  return disabled;
}

export function companionHostAllowed(hostname: string) {
  const normalized = hostname.toLowerCase();
  const labsVercelDeployment = /^koinophobia-labs(?:-[a-z0-9-]+)?\.vercel\.app$/.test(normalized);
  return normalized === "koinophobialabs.com" || normalized === "www.koinophobialabs.com" || normalized === "localhost" || normalized === "127.0.0.1" || labsVercelDeployment;
}
