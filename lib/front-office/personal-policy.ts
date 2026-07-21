/**
 * The founder front office — koinophobia.dev's host policy.
 *
 * Job: match a visitor with the most relevant product, explain what is
 * actually usable today, and route hiring intent to the studio — all without
 * collecting anything. This host gathers NO contact information and submits
 * NOTHING; its terminal states are a truthful card and, at most, a link the
 * visitor chooses to follow.
 *
 * Every product fact on a card comes verbatim from lib/dev/universe.ts —
 * status, stage/reach vocabulary, honesty lines, destinations. The matcher
 * keywords below are conversational routing config, not product facts; a test
 * asserts every product in the universe has a matcher so a new product cannot
 * be silently unreachable.
 *
 * ISOLATION: this module must never import lib/commercial or lib/concierge —
 * the same two-lock separation the koi themselves enforce.
 */

import { detectBusinessType } from "@/lib/front-office/detect";
import { LINKS } from "@/lib/links";
import { nowActiveWork, nowLastUpdated } from "@/lib/now";
import { getProduct, products, reachLabel, stageLabel, studio } from "@/lib/dev/universe";
import type {
  ExtractionResult,
  FollowUpQuestion,
  FrontOfficePolicy,
  FrontOfficeSession,
  ProductMatch,
  StudioHandoff,
} from "@/lib/front-office/types";

/* ------------------------------------------------------------- intents */

export const personalIntents = [
  { id: "find_product", label: "Find the right product", hint: "Match what you're working on to the closest build." },
  { id: "whats_building", label: "See what Blake is building", hint: "The live status of everything in motion." },
  { id: "how_it_works", label: "Understand how a product works", hint: "The thinking, decisions, and honest state." },
  { id: "try_test", label: "Use or test a product", hint: "What's actually open today, without asking anyone." },
  { id: "hire", label: "Hire Koinophobia Labs", hint: "Client work runs through the studio." },
  { id: "collaborate", label: "Discuss a collaboration", hint: "Straight to Blake's inbox." },
  { id: "explore", label: "Explore on my own", hint: "Pointers, then the koi goes back to resting." },
] as const;

/* ------------------------------------------------------------ matching */

/** Conversational routing per product. Facts stay in the universe. */
const PRODUCT_MATCHERS: Record<string, { category: string; patterns: RegExp[] }> = {
  "career-forge": {
    category: "the job search",
    patterns: [
      /r[eé]sum[eé]|\bcv\b/i,
      /laid off|lay.?off|lost my job|job (search|hunt|market)/i,
      /linkedin|interview|applications?\b|cover letter/i,
      /career/i,
    ],
  },
  trendi: {
    category: "making content",
    patterns: [
      /\bcamera\b|record(ing)?\b|film(ing)?\b/i,
      /script|caption|hook\b/i,
      /content|creator|video|tiktok|reels?\b|youtube|shorts\b/i,
      /say (it |something )?(on camera|out loud)/i,
      /ideas? into/i,
    ],
  },
  "you-know-ball": {
    category: "sports takes",
    patterns: [
      /sports?\b|\bnba\b|\bnfl\b|\bmlb\b|\bnhl\b|basketball|football|baseball/i,
      /\btakes?\b|debate|argu(e|ing|ment)|hot take/i,
      /know ball/i,
    ],
  },
  "koi-cave": {
    category: "private personal tooling",
    patterns: [
      /\bnotes?\b|\btasks?\b|productivity/i,
      /local.?first|\bprivate\b|on my (own )?(mac|machine|computer)/i,
      /personal (tool|infrastructure|os|system)/i,
    ],
  },
};

export function matchProduct(text: string): { slug: string; category: string } | undefined {
  const scored = Object.entries(PRODUCT_MATCHERS)
    .map(([slug, matcher]) => ({
      slug,
      category: matcher.category,
      score: matcher.patterns.filter((pattern) => pattern.test(text)).length,
    }))
    .sort((a, b) => b.score - a.score);
  const [top, second] = scored;
  // A tie is a question, not a guess.
  if (top.score === 0 || top.score === second.score) return undefined;
  return { slug: top.slug, category: top.category };
}

const HIRE_PATTERN =
  /\bhire\b|build (one of these|something|a (system|site|website|tool|app|workflow))[^.?!]{0,40} for (my|our|us|me)\b|for my (business|company|clients)\b|client work|do this for (my|us)\b/i;
const COLLAB_PATTERN = /collaborat|partner(ship| with)?\b|work together|team up|co.?found/i;
const NOW_PATTERN = /what (is|'s| are you) (he |blake )?(building|working on)( (now|right now|these days))?/i;
const WANTS_BETA_PATTERN = /test ?flight|\bbeta\b|try (the )?(ios|iphone) (app|version)|\binstall\b/i;

export function extractPersonalFields(text: string): ExtractionResult {
  const trimmed = text.replace(/\s+/g, " ").trim().slice(0, 400);
  const fields: Record<string, string> = {};
  const inferred: string[] = [];
  if (trimmed) fields.goalText = trimmed;

  let intent: string | undefined;
  if (HIRE_PATTERN.test(text)) intent = "hire";
  else if (COLLAB_PATTERN.test(text)) intent = "collaborate";
  else if (NOW_PATTERN.test(text)) intent = "whats_building";

  const product = matchProduct(text);
  if (product) {
    fields.productSlug = product.slug;
    fields.goalCategory = product.category;
    inferred.push("productSlug");
  }
  if (WANTS_BETA_PATTERN.test(text)) fields.wants = "beta";

  const businessType = detectBusinessType(text);
  if (businessType) {
    fields.industry = businessType;
    inferred.push("industry");
  }
  return { fields, inferred, intent };
}

/* ----------------------------------------------------------- questions */

const PRODUCT_INTENTS = new Set(["find_product", "how_it_works", "try_test"]);

export const personalQuestions: FollowUpQuestion[] = [
  {
    id: "goal",
    field: "productSlug",
    kind: "chips",
    prompt: () => "What are you trying to get done?",
    hint: () => "Pick the closest, or say it in your own words.",
    chips: () => [
      ...products.map((product) => ({
        value: product.slug,
        label: PRODUCT_MATCHERS[product.slug]?.category
          ? PRODUCT_MATCHERS[product.slug].category.charAt(0).toUpperCase() + PRODUCT_MATCHERS[product.slug].category.slice(1)
          : product.name,
        hint: product.tagline,
      })),
      { value: "none", label: "Just exploring", hint: "Pointers to the good rooms." },
    ],
    eligible: (session) => !session.intent || PRODUCT_INTENTS.has(session.intent),
  },
];

/* -------------------------------------------------------------- policy */

export const personalPolicy: FrontOfficePolicy = {
  host: "personal",
  intents: personalIntents.map(({ id, label, hint }) => ({ id, label, hint })),
  applyIntent: (intentId): Record<string, string> =>
    intentId === "explore" ? { productSlug: "none" } : {},
  extract: extractPersonalFields,
  questions: personalQuestions,
  requiredFields: (session) =>
    !session.intent || PRODUCT_INTENTS.has(session.intent) ? ["productSlug"] : [],
  collectsContact: false,
};

/* ------------------------------------------------------------ outcomes */

export type PersonalOutcome =
  | { kind: "product"; match: ProductMatch }
  | { kind: "now"; updated: string; items: { name: string; stage: string }[]; href: string }
  | { kind: "handoff"; handoff: StudioHandoff; explanation: string }
  | { kind: "collaborate"; href: string; note: string }
  | { kind: "explore"; links: { label: string; href: string }[] };

/** The shortest honesty line — canonical text verbatim, sized for a card.
 *  (The full notYet block lives one click away on the product page.) */
function cardLimitation(notYet: string[]): string {
  return [...notYet].sort((a, b) => a.length - b.length)[0] || "";
}

function firstSentence(text: string): string {
  const match = text.match(/^[^.!?]{10,220}[.!?]/);
  return match ? match[0].trim() : text.slice(0, 220);
}

export function buildProductMatch(session: FrontOfficeSession): ProductMatch | null {
  const product = getProduct(session.fields.productSlug || "");
  if (!product) return null;

  const wantsBeta = session.fields.wants === "beta";
  const betaAction = product.actions.find((action) => /beta|test ?flight|access/i.test(action.label));
  const primaryAction =
    product.actions.find((action) => action.primary) ?? product.actions[0] ?? null;

  // Truth policy: a request for access that does not exist gets the canonical
  // status verbatim and the closest REAL destination — never a synthesized link.
  const truthNote =
    wantsBeta && !betaAction
      ? `There isn't a beta or TestFlight link to send. The honest state: ${product.status}.`
      : undefined;
  const destination = wantsBeta && betaAction ? betaAction : primaryAction;

  return {
    slug: product.slug,
    name: product.name,
    who: product.tagline,
    addresses: firstSentence(product.problem),
    availability: `${stageLabel[product.stage]} · ${reachLabel[product.reach]}`,
    limitation: cardLimitation(product.notYet),
    destination: destination
      ? { label: destination.label, href: destination.href, external: Boolean(destination.external) }
      : { label: "Read how it works", href: `/products/${product.slug}`, external: false },
    whyFit: session.fields.goalCategory
      ? `You described ${session.fields.goalCategory} — the exact gap ${product.name} was built against.`
      : `${product.name} is the closest match to what you described.`,
    ...(truthNote ? { truthNote } : {}),
  };
}

const HANDOFF_EXPLANATION =
  "koinophobia.dev is Blake's founder and product world. Client work runs through Koinophobia Labs — the studio has its own intake, and what you've told me carries over so you don't start from zero.";

export function buildStudioHandoff(session: FrontOfficeSession): StudioHandoff {
  const need = (session.fields.goalText || "").slice(0, 200);
  const industry = session.fields.industry || "";
  const carried = [industry, need].filter(Boolean).join(" — ") || "A project inquiry from koinophobia.dev";
  const context = carried.slice(0, 240);
  return {
    carried,
    href: `${studio.href}/intake?service=${encodeURIComponent("Not sure yet")}&context=${encodeURIComponent(context)}`,
  };
}

export function personalOutcome(session: FrontOfficeSession): PersonalOutcome {
  if (session.intent === "hire") {
    return { kind: "handoff", handoff: buildStudioHandoff(session), explanation: HANDOFF_EXPLANATION };
  }
  if (session.intent === "collaborate") {
    const subject = encodeURIComponent("Collaboration — via koinophobia.dev");
    return {
      kind: "collaborate",
      href: `${LINKS.email}?subject=${subject}`,
      note: "Collaboration goes straight to Blake — no form, no queue. Say what you're building and where it overlaps.",
    };
  }
  if (session.intent === "whats_building") {
    return {
      kind: "now",
      updated: nowLastUpdated,
      items: nowActiveWork.map((item) => ({ name: item.name, stage: item.stage })),
      href: "/now",
    };
  }
  const match = buildProductMatch(session);
  if (match) return { kind: "product", match };
  return {
    kind: "explore",
    links: [
      { label: "The products", href: "/products" },
      { label: "The lab", href: "/lab" },
      { label: "What's moving now", href: "/now" },
      { label: "About Blake", href: "/about" },
    ],
  };
}
