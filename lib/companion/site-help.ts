// Thin, backward-compatible adapter over the grounded site-knowledge module.
//
// The prose that used to live here (hand-typed prices/timelines) has moved to
// lib/companion/site-knowledge.ts, which derives every answer from the same
// lib/commercial.ts the studio pages render. This file keeps the original
// public API (SITE_HELP_TOPICS / answerSiteQuestion) so the panel and tests
// that import it continue to work unchanged.

import {
  answerGroundedQuestion,
  GROUNDED_TOPICS,
  type GroundedAnswer,
  type GroundedTopic,
  type SiteHelpTopicId,
} from "@/lib/companion/site-knowledge";

export type SiteHelpTopic = GroundedTopic;
export type { SiteHelpTopicId };

export const SITE_HELP_TOPICS: readonly SiteHelpTopic[] = GROUNDED_TOPICS;

export type SiteHelpAnswer = Pick<GroundedAnswer, "id" | "answer" | "href" | "linkLabel" | "matched" | "clarify">;

export function answerSiteQuestion(rawQuestion: string): SiteHelpAnswer {
  const { id, answer, href, linkLabel, matched, clarify } = answerGroundedQuestion(rawQuestion);
  return { id, answer, href, linkLabel, matched, clarify };
}
