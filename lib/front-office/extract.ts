/**
 * Deterministic extraction from a visitor's messy first message.
 *
 * This is keyword classification and pattern capture, not language modeling.
 * Every inference is marked `inferred` and surfaced editable at review — the
 * visitor always gets the last word. When a signal is ambiguous the correct
 * output is NOTHING: an unfilled field becomes one focused follow-up
 * question, which is cheaper than a wrong guess the visitor has to undo.
 *
 * Visitor text is untrusted data. Nothing here executes, fetches, or follows
 * instructions found in it; the studio's scoring layer additionally strips
 * prompt-injection phrasing before routing (lib/concierge/routing.ts).
 */

import type { ExtractionResult } from "@/lib/front-office/types";
import { detectBusinessType, detectUrl } from "@/lib/front-office/detect";
import { conciergeBudgetRanges, conciergeTimelines, type ProblemKind } from "@/lib/concierge/types";

const MAX_INPUT = 4000;

/** Problem-kind signals, mirroring the vocabulary the deterministic router
 *  scores on. Order matters only for tie-breaking; a clear margin is required
 *  before anything is inferred at all. */
const PROBLEM_SIGNALS: Record<ProblemKind, RegExp[]> = {
  website: [
    /\bwebsites?\b|\bsite\b|landing page|home ?page/i,
    /outdated|looks (old|bad|dated)|redesign|rebuild/i,
    /mobile (experience|layout|version)|page speed|slow (site|page)/i,
    /conversion|\bcta\b|not converting/i,
  ],
  lead_followup: [
    /follow.?up|response time|reply (slow|late|inconsistent)/i,
    /leads? (fall|drop|disappear|go cold|slip)/i,
    /inquir(y|ies)|never (finish|complete) (booking|checkout|the form)/i,
    /no.?shows?|abandon(ed|ing)? (booking|cart|form)/i,
    // How real visitors phrase it (audit journeys A/B): messaging that
    // never converts into an actual booking or purchase.
    /people (message|dm|text|contact|reach out)/i,
    /(never|don'?t|won'?t|half of them|barely) (of them )?(actually |really )?(book|schedule|buy|purchase|show up)/i,
  ],
  manual_work: [
    /manual(ly)?|by hand|copy.?past(e|ing)|data entry/i,
    /spreadsheet|same questions?|repetitive|every (day|week) we/i,
    /organiz(e|ing) (customer )?(emails?|inbox)|rout(e|ing) (emails?|requests?|leads?)/i,
    /assign(ing)? (work|requests?|tickets?)|sending them to (different|other)/i,
    // Intake-shaped pain: someone digging through channels because requests
    // arrive incomplete ("people leave out size, placement, references…").
    /(go(es|ing)?|sort(s|ing)?|dig(s|ging)?) through (emails?|messages|dms|instagram)/i,
    /leave out|missing (details|info(rmation)?)|incomplete (requests?|inquiries|messages)/i,
  ],
  custom_product: [
    /app idea|build (an? )?(app|product|tool|portal|dashboard|prototype)/i,
    /\bmvp\b|custom (software|tool|platform)|internal tool/i,
  ],
  small_fix: [
    /broken (button|form|link|page)|one (small|quick) (fix|change|thing)/i,
    /tracking (broken|missing)|analytics gap|pixel/i,
    /responsive bug|doesn.?t work on (iphone|android|mobile)/i,
  ],
  unsure: [
    /not sure|don.?t know (what|where)|no idea/i,
    /something('s| is) (wrong|off|broken)(?! with the (button|form|link))/i,
    /losing (revenue|money|customers|time)|leak/i,
    /need more customers/i,
  ],
};

export function classifyProblemKind(text: string): ProblemKind | undefined {
  const input = text.slice(0, MAX_INPUT);
  const scores = (Object.entries(PROBLEM_SIGNALS) as [ProblemKind, RegExp[]][])
    .map(([kind, patterns]) => [kind, patterns.filter((p) => p.test(input)).length] as const)
    .sort((a, b) => b[1] - a[1]);
  const [top, second] = scores;
  // A single weak hit with a rival is not a classification — ask instead.
  if (top[1] === 0 || (top[1] === 1 && second[1] >= 1)) return undefined;
  return top[0];
}

/** First http(s)-able URL or bare domain in the text. */
export const extractUrl = detectUrl;

/** Map a mentioned dollar figure to the canonical budget ranges. Only fires
 *  when the number appears in budget context — a "$50 no-show fee" is not a
 *  budget. */
export function extractBudgetRange(text: string): string | undefined {
  const scoped = text.slice(0, MAX_INPUT);
  if (!/budget|spend|invest|afford|cost|price/i.test(scoped)) return undefined;
  const match = scoped.match(/\$\s?(\d{1,3}(?:,\d{3})*|\d+)(k)?/i);
  if (!match) return undefined;
  const amount = Number(match[1].replace(/,/g, "")) * (match[2] ? 1000 : 1);
  if (!Number.isFinite(amount) || amount <= 0) return undefined;
  if (amount < 500) return conciergeBudgetRanges[0];
  if (amount < 1500) return conciergeBudgetRanges[1];
  if (amount < 3500) return conciergeBudgetRanges[2];
  return conciergeBudgetRanges[3];
}

export function extractTimeline(text: string): string | undefined {
  const scoped = text.slice(0, MAX_INPUT);
  if (/asap|urgent|right away|this week|next week|immediately/i.test(scoped)) return conciergeTimelines[0];
  // "in two weeks" sits between the chips; within-a-month is the honest bucket.
  if (/this month|few weeks|next month|(?:in )?(?:two|2|three|3|a couple(?: of)?) weeks/i.test(scoped)) return conciergeTimelines[1];
  if (/(1|one|2|two|couple(?: of)?) months|this quarter/i.test(scoped)) return conciergeTimelines[2];
  if (/just (looking|researching|exploring|curious)|no rush|someday/i.test(scoped)) return conciergeTimelines[3];
  return undefined;
}

/** No-contact language ("just looking, don't contact me"). The flow never
 *  demanded contact anyway — but a visitor who says this deserves to be told
 *  so, once, instead of being silently marched into questions. */
export function detectContactReluctance(text: string): boolean {
  return /don'?t (contact|email|call|reach out)|no (?:sales |phone )?(contact|emails?|calls?|spam|pitch)|not (giving|sharing) (my )?(email|info|number)|just (looking|browsing)/i.test(
    text.slice(0, MAX_INPUT),
  );
}

/** "my tattoo shop" → "Tattoo shop". */
export const extractBusinessType = detectBusinessType;

/**
 * The studio-host extraction bundle. `primaryProblem` is always the visitor's
 * own words (capped to the validation limit) — the system never rewrites the
 * problem statement for them.
 */
export function extractStudioFields(text: string): ExtractionResult {
  const trimmed = text.replace(/\s+/g, " ").trim().slice(0, 1200);
  const fields: Record<string, string> = {};
  const inferred: string[] = [];
  if (trimmed) fields.primaryProblem = trimmed;

  const kind = classifyProblemKind(text);
  if (kind) {
    fields.problemKind = kind;
    inferred.push("problemKind");
  }
  const url = extractUrl(text);
  if (url) {
    fields.websiteUrl = url;
    inferred.push("websiteUrl");
  }
  const budget = extractBudgetRange(text);
  if (budget) {
    fields.budgetRange = budget;
    inferred.push("budgetRange");
  }
  const timeline = extractTimeline(text);
  if (timeline) {
    fields.timeline = timeline;
    inferred.push("timeline");
  }
  const businessType = extractBusinessType(text);
  if (businessType) {
    fields.industry = businessType;
    inferred.push("industry");
  }
  // Not a brief field — a one-time cue for the UI to say "nothing is sent
  // unless you send it." Excluded from the review brief and the payload.
  if (detectContactReluctance(text)) fields.contactReluctance = "noted";
  return { fields, inferred };
}
