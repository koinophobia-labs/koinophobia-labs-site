import {
  Bot,
  BrainCircuit,
  CheckCircle2,
  CircuitBoard,
  Code2,
  Gauge,
  Globe2,
  LayoutDashboard,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Workflow,
  Zap,
} from "lucide-react";

export const navItems = [
  { id: "products", label: "Products" },
  { id: "proof", label: "Proof" },
  { id: "concepts", label: "Concepts" },
  { id: "services", label: "Services" },
  { id: "about", label: "About" },
  { id: "contact", label: "Contact" },
];

export const heroProof = [
  "iOS archive ready for upload",
  "Vercel web MVP shipped",
  "Red-team: 80 prompts · 0 violations",
];

export const ykbFeatures = [
  {
    title: "Banter Bot engine",
    description: "Drop a take and it pushes back with a real argument — not yes-man energy.",
  },
  {
    title: "Answer First responses",
    description: "It commits to a position immediately, then defends it. No fence-sitting.",
  },
  {
    title: "Know Ball Score & rank",
    description: "Defend well and climb the ladder from Rookie to GOAT.",
  },
  {
    title: "Daily challenge",
    description: "A fresh take to defend every day — keeps the debate sharp.",
  },
  {
    title: "Shareable scorecards",
    description: "Turn a round into a clean card you can post — built for creators.",
  },
  {
    title: "Guardrails, by design",
    description: "Refuses picks, lines, and parlays. Debate only — never betting advice.",
  },
];

export const ykbReceipts = [
  "iOS build 1.0 (5) archived",
  "Live web MVP",
  "Vercel-hosted",
  "iPhone-first app shell",
  "Red-team 80 / 0 violations",
  "Live quick-gate passed",
  "Answer First engine",
  "TestFlight upload pending ASC access",
  "Betting guardrails active",
];

export const productModules = [
  {
    name: "You Know Ball",
    status: "LIVE",
    tone: "orange",
    what:
      'a sports-debate AI that turns your hottest take into a defended argument — then into content. Banter Bot, "Your Move" handbacks, Know Ball Score.',
    who: "fans, creators, and sports communities who love to argue and want receipts.",
    why:
      "proof the lab ships real consumer AI — with guardrails, iPhone-first, in public.",
    receipts: [
      "iOS archive ready",
      "Live web MVP",
      "Vercel-hosted",
      "iPhone-first",
      "Red-team 80 / 0",
      "Answer First",
    ],
    cta: "View product",
    href: "#products",
  },
  {
    name: "Creator AI Command Center",
    status: "BUILD",
    tone: "cyan",
    what:
      "a control room for creators — repurposing, prompt systems, content pipelines, scheduling logic in one operating system.",
    who: "creators & operators drowning in scattered content workflow.",
    why: "turns chaos into leverage you run on autopilot.",
    receipts: ["Private product", "In active dev", "Creator ops"],
    cta: "Get early access",
    href: "#contact",
  },
  {
    name: "KOI Cave",
    status: "LOCAL",
    tone: "gray",
    what:
      "a local-first personal AI command system — your private operator brain. Notes, tasks, memory, automations that you own.",
    who: "builders who want AI leverage without renting their data to the cloud.",
    why:
      "personal infrastructure beats personal productivity apps. Owned, not subscribed.",
    receipts: ["Local-first", "Personal AI OS", "Runs private"],
    cta: "Ask about it",
    href: "#contact",
  },
  {
    name: "AI Workflow / Site Builds",
    status: "OPEN",
    tone: "gold",
    what:
      "custom AI workflows, automations, landing pages, and MVPs — built and shipped for clients.",
    who: "founders, small teams, and creators who need a builder, not a deck.",
    why:
      "this is how we work together: productized building, real deadlines, real shipping.",
    receipts: ["Open for work", "Productized", "Ship-focused"],
    cta: "Start a build",
    href: "#services",
  },
  {
    name: "Career Forge Lite",
    status: "LIVE",
    tone: "magenta",
    what: "ATS-focused resume and LinkedIn package generator.",
    who: "early-career professionals, career changers, and job seekers.",
    why:
      "transforms everyday work experience into recruiter-friendly language and ATS-safe career documents.",
    receipts: ["Live MVP", "ATS-focused", "Resume package", "LinkedIn headline"],
    cta: "Open Tool",
    href: "https://career-forge-lite.vercel.app",
    secondaryCta: "GitHub",
    secondaryHref: "https://github.com/koinophobia-labs/career-forge-lite",
  },
];

export const proofReceipts = [
  {
    title: "You Know Ball → TestFlight-ready archive",
    description:
      "iOS build 1.0 (5) is archived. Upload is blocked until App Store Connect access is fixed. Public App Store review has not been submitted.",
    tag: "iOS",
  },
  {
    title: "Live web MVP",
    description: "Vercel-hosted and gated for early access.",
    tag: "DEPLOY",
  },
  {
    title: "Guardrail red-team",
    description:
      "Adversarial prompts run against the debate engine. Zero hard violations.",
    tag: "SAFETY",
    metric: "80 / 0",
  },
  {
    title: "Live quick-gate passed",
    description: "Safety gate clears before any response ships.",
    tag: "GATE",
  },
  {
    title: "Debate engine — \"Answer First\" behavior",
    description: "commits to a side, then defends it.",
    tag: "ENGINE",
  },
  {
    title: "Sports & betting guardrails",
    description: "Active. Refuses picks, lines, and parlays.",
    tag: "GUARD",
  },
  {
    title: "iPhone-first app shell",
    description: "Built thumb-first and tested on device.",
    tag: "MOBILE",
  },
  {
    title: "Live AI adapter",
    description: "Swappable model layer wired into the running product.",
    tag: "AI",
  },
  {
    title: "Creator AI Command Center",
    description: "Private product in active development.",
    tag: "BUILD",
  },
  {
    title: "KOI Cave",
    description: "Local-first personal AI command system.",
    tag: "LOCAL",
  },
  {
    title: "Docs / QA / red-team mindset",
    description: "Documented and tested before anything ships.",
    tag: "RIGOR",
  },
];

export const services = [
  {
    icon: Workflow,
    name: "AI workflow setup",
    problem: "Manual, repetitive work eating your week.",
    get: "Automated workflows wired into the tools you already use.",
    best: "Founders & operators buried in busywork.",
  },
  {
    icon: Globe2,
    name: "Website & landing builds",
    problem: "No home base that actually sells what you do.",
    get: "A fast, sharp, conversion-focused site — shipped.",
    best: "Creators & small businesses that need to look real.",
  },
  {
    icon: MessageSquare,
    name: "Creator content systems",
    problem: "Content is chaos and it's burning you out.",
    get: "A repeatable system from idea to published.",
    best: "Creators scaling output without losing their mind.",
  },
  {
    icon: Bot,
    name: "Discord / community automation",
    problem: "Your Discord runs on manual moderation.",
    get: "Bots, onboarding flows, and automations that run themselves.",
    best: "Community leaders & creator audiences.",
  },
  {
    icon: Code2,
    name: "MVP / product prototype builds",
    problem: "An idea stuck in your head with no proof.",
    get: "A working prototype people can actually use.",
    best: "Founders validating before they overbuild.",
  },
  {
    icon: LayoutDashboard,
    name: "Personal command-center / dashboards",
    problem: "Your work and life are scattered across ten tabs and your head.",
    get: "A personal command center or dashboard that runs your day.",
    best: "Operators & builders who want one screen of truth.",
  },
];

export const whyKoinophobia = [
  {
    title: "Direct founder access",
    body: "You work with Blake directly from scope to launch.",
  },
  {
    title: "No account managers",
    body: "No handoffs, vague ticket chains, or agency phone tag.",
  },
  {
    title: "Founder-led decisions",
    body: "Build decisions stay inside Koinophobia Labs.",
  },
  {
    title: "Fast iteration cycles",
    body: "Small review loops, quick changes, clear next steps.",
  },
  {
    title: "Transparent build process",
    body: "Pages, assets, scope, and revision windows are agreed up front.",
  },
  {
    title: "Modern hosting/deployment",
    body: "Built for fast hosting, clean deployment, and shareable live links.",
  },
  {
    title: "Support options available",
    body: "Post-launch edits and maintenance can be scoped separately.",
  },
];

export const websiteBuildIncludes = [
  "Mobile-first landing page or website",
  "Contact / booking CTA",
  "Policy or FAQ section",
  "Portfolio / proof section",
  "Basic SEO metadata",
  "Analytics-ready structure",
  "Deployment support",
  "Revision window",
];

export const goodFitItems = [
  "Tattoo artists, barbers, trainers, local service businesses, creators",
  "Businesses that need a sharper online presence fast",
  "Owners who want direct collaboration",
];

export const notFitItems = [
  "Large enterprise builds",
  "Complex ecommerce platforms",
  "Regulated or high-risk industries",
  "Projects needing 24/7 agency support",
];

export const betaOfferPoints = [
  "Founder-led builds are currently available for early local clients.",
  "Pricing, scope, and timeline are agreed before work starts.",
  "No surprise AI automation or auto-posting.",
  "Client owns their brand, content, and domain decisions.",
  "Work is reviewable before launch.",
];

export const clientFaqs = [
  {
    question: "Are you a real agency?",
    answer:
      "Koinophobia Labs is a solo founder-led product and build studio. You work directly with Blake, not a sales layer.",
  },
  {
    question: "Do you use AI?",
    answer:
      "Yes, as a build accelerator for drafting, structure, and iteration. Nothing launches without review, and no AI auto-posting is added without explicit agreement.",
  },
  {
    question: "What happens after launch?",
    answer:
      "The site can be handed off, or we can scope a support window for edits, maintenance, and small improvements.",
  },
  {
    question: "Can you work with my current Instagram/booking flow?",
    answer:
      "Yes. Many local businesses should keep the flow customers already use; the site can point to it cleanly.",
  },
  {
    question: "Do I need a domain already?",
    answer:
      "No. If you have one, we can use it. If not, domain and hosting decisions can be made during scope.",
  },
  {
    question: "How do revisions work?",
    answer:
      "A revision window is agreed before work starts so feedback is expected, bounded, and reviewable before launch.",
  },
];

export const bootLines = [
  "$ init koinophobia.labs --operator",
  "operator ........ BLAKE TAYLOR",
  "studio .......... AI PRODUCT LAB",
  "mounting product modules [5]",
  "you-know-ball ............. LIVE",
  "creator-command-center .... BUILD",
  "koi-cave .................. LOCAL",
  "client-builds ............. OPEN",
  "career-forge-lite ......... LIVE",
  "> system online.",
];

export const quickTakes = [
  "LeBron > Jordan",
  "The Chiefs are overrated",
  "Wemby is already top 5",
];

export const contactOptions = [
  "AI workflow / automation",
  "Website / landing page",
  "Creator content system",
  "Community automation",
  "MVP / prototype build",
  "You Know Ball — tester access",
  "Career Forge — Resume Rebuild ($149)",
  "Something else",
];

export const footerTags = [
  { label: "FOUNDER-LED", tone: "cyan" },
  { label: "OPERATOR MINDSET", tone: "gold" },
  { label: "SHIP USEFUL SOFTWARE", tone: "magenta" },
];

export const serviceIcons = {
  CheckCircle2,
  CircuitBoard,
  BrainCircuit,
  Gauge,
  ShieldCheck,
  Sparkles,
  Zap,
};
