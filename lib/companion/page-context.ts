export type CompanionAction = {
  id: "concierge" | "intake" | "services" | "human_review";
  label: string;
  href?: string;
};

export type CompanionPageContext = {
  routeKey: string;
  enabled: boolean;
  invitation?: string;
  actions: CompanionAction[];
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
  preferredSide: "right",
  invitationDelayMs: 0,
};

const exactContexts: Record<string, Omit<CompanionPageContext, "enabled" | "actions"> & { actions?: CompanionAction[] }> = {
  "/": {
    routeKey: "home",
    invitation: "Not sure where to start?",
    preferredSide: "right",
    invitationDelayMs: 14_000,
  },
  "/services": {
    routeKey: "services",
    invitation: "I can help match the problem to a service.",
    preferredSide: "right",
    invitationDelayMs: 12_000,
  },
  "/work": {
    routeKey: "work",
    invitation: "Want to find the closest fit for your project?",
    preferredSide: "left",
    invitationDelayMs: 16_000,
  },
  "/products": {
    routeKey: "products",
    invitation: "Looking for something built around your business?",
    preferredSide: "right",
    invitationDelayMs: 16_000,
  },
  "/process": {
    routeKey: "process",
    invitation: "I can help turn the process into a practical first step.",
    preferredSide: "right",
    invitationDelayMs: 18_000,
  },
  "/about": {
    routeKey: "about",
    invitation: "Want Blake to review the shape of your project?",
    preferredSide: "right",
    invitationDelayMs: 18_000,
  },
  "/audit": {
    routeKey: "audit",
    invitation: "Unsure whether you need an audit or a build?",
    preferredSide: "left",
    invitationDelayMs: 15_000,
  },
  "/revenue-leak-audit": {
    routeKey: "audit",
    invitation: "Unsure whether you need an audit or a build?",
    preferredSide: "left",
    invitationDelayMs: 15_000,
  },
  "/intake": {
    routeKey: "intake",
    invitation: "I can help organize the project before you submit.",
    preferredSide: "left",
    invitationDelayMs: 18_000,
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
      preferredSide: "left",
      invitationDelayMs: 18_000,
    };
  }

  if (path.startsWith("/demos/")) {
    return {
      routeKey: "demo",
      enabled: true,
      invitation: "Want to map this kind of experience to your business?",
      actions: baseActions,
      preferredSide: "right",
      invitationDelayMs: 18_000,
    };
  }

  return disabled;
}

export function companionHostAllowed(hostname: string) {
  const normalized = hostname.toLowerCase();
  const labsVercelDeployment = /^koinophobia-labs(?:-[a-z0-9-]+)?\.vercel\.app$/.test(normalized);
  return normalized === "koinophobialabs.com" || normalized === "www.koinophobialabs.com" || normalized === "localhost" || normalized === "127.0.0.1" || labsVercelDeployment;
}
