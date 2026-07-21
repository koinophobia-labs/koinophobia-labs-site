# The Koi Front Office

Turning the two koi from page-aware companions into a structured AI front
office: messy visitor thought → guided clarification → structured brief →
correct destination → concrete next action. The assistant demonstrates the
service Koinophobia Labs sells.

## Phase 1 audit — current execution paths (2026-07-21)

### Commercial host (koinophobialabs.com)

```
KoiCompanion (layout-mounted, companionHostAllowed)
  └─ KoiCompanionPanel        modal dialog: menu / understand / compare /
      │                       work / help / concierge surfaces
      └─ ConciergeFlow        7 fixed questions, choice-first
          └─ POST /api/concierge/evaluate
              ├─ scoreConcierge          deterministic router (injection-
              │                          stripped, harmful/regulated guards)
              ├─ enhanceWithAI           OPTIONAL OpenAI, strict JSON schema,
              │                          validated, falls back cleanly
              └─ signConciergeEvaluation HMAC token (summary + source only)
          └─ /intake?concierge=<sessionId>
              └─ IntakeForm    prefilled, every field editable, explicit
                  │            submit = consent
                  └─ POST /api/intake
                      ├─ origin check, rate limit, honeypot, validation
                      ├─ server-side RE-SCORE (client is never authoritative)
                      ├─ storeLead        Postgres crm_leads, idempotent via
                      │                   dedupe key concierge:<sessionId>
                      └─ sendLeadEmail    Resend, reply_to = visitor
```

Session drafts: `sessionStorage`, tab-scoped, 24 h TTL, validated on parse
(`lib/concierge/session.ts`). Analytics: `trackStudioEvent` →
`@vercel/analytics` `track()`, categorical properties only.

### Personal host (koinophobia.dev)

```
PersonalKoi (DevShell + /home + /now + /connect, personalKoiHostAllowed —
             exact inverse of the studio allowlist; sets are disjoint)
  └─ observation notes only. No panel, no conversation, no lead capture.
     Truth sources: lib/dev/universe.ts, lib/now.ts, lib/dev/lab.ts.
```

### What already satisfies the mission

- Deterministic recommendation core with prompt-injection stripping.
- Optional model layer with schema-strict validation and a deterministic
  fallback (`source: deterministic | ai_assisted | fallback`).
- Consent semantics: nothing reaches the CRM until an explicit submit; the
  review surface is editable; server re-validates and re-scores.
- Idempotent lead storage, Resend notification, honeypot, rate limits,
  origin checks.
- Canonical data: `lib/commercial.ts` (offers, prices, timelines),
  `lib/dev/universe.ts` (product truth), `lib/now.ts`, `lib/dev/lab.ts`.

### Gaps the front office adds

1. Free-text-first: visitors type a messy thought; today the concierge walks
   every visitor through all seven steps regardless of what they already said.
2. koinophobia.dev has no assistant surface at all — no product matching, no
   hiring handoff.
3. No in-panel structured review + consent flow (today review happens on the
   /intake page).
4. No founder→studio warm handoff carrying context.
5. No front-office funnel analytics.

## Architecture

One deterministic engine, two host policies. **No new lead schema, no second
recommendation engine, no new provider surface** — the engine produces
`ConciergeAnswers` progressively from conversation and reuses the existing
evaluate + intake endpoints verbatim.

```
lib/front-office/
  types.ts            AssistantStage, FrontOfficeSession, intents, briefs
  engine.ts           pure reducer + selectors (no React, no I/O)
  extract.ts          deterministic NL extraction: problem-kind classifier,
                      URL / budget / timeline / business-type detection
  storage.ts          sessionStorage per host key, TTL, validated parse
  studio-policy.ts    commercial intents, follow-up questions (reuses
                      branchPrompt vocabulary), recommendation = scoreConcierge
                      + offer details resolved from lib/commercial serviceOffers,
                      FormData builder for /api/intake
  personal-policy.ts  founder intents, product matching from lib/dev/universe,
                      availability/limitation/destination straight from
                      canonical fields, hiring → studio handoff URL builder

components/front-office/FrontOfficeChat.tsx   shared conversation UI
components/dev-koi/PersonalKoiPanel.tsx       .dev panel (sheet on mobile)
KoiCompanionPanel                             gains a "front_office" surface
```

### Isolation rules (unchanged and enforced by tests)

- `studio-policy` may import `lib/commercial` + `lib/concierge/*`.
- `personal-policy` may import `lib/dev/universe`, `lib/now`, `lib/dev/lab`
  and must never import commercial or concierge modules.
- `PersonalKoi.tsx` keeps its note as a note (no dialog semantics); the panel
  is a separate component. Host allowlists stay disjoint.
- Separate storage keys per host; sessions never merge.

### Model layer decision

The only model call remains the existing `enhanceWithAI` inside
`/api/concierge/evaluate` (schema-strict, summary-only, deterministic
fallback). The conversation itself is fully deterministic: extraction and
question selection are pure functions. This satisfies "works with no API key"
by construction and adds zero new prompt-injection surface.

### Truth failure policy (personal host)

Requests for unavailable things (e.g. a You Know Ball TestFlight link) are
answered from canonical data: state the honest stage/reach, offer the closest
real destination (`actions[]`), never synthesize a link. `LINKS.ykbTestflight`
is empty on purpose; the policy treats an empty link as "does not exist."

### Handoff (dev → labs)

Hiring intent on koinophobia.dev produces a handoff card that shows exactly
what will be carried (business type + need, compact, no contact info — the
personal host never collects contact info) and links to
`koinophobialabs.com/intake?service=…&context=<capped text>`. IntakeForm
prefills `biggestProblem` from `context`; the visitor still reviews and
explicitly submits there. Nothing is transferred silently.

## Migration / legacy note

`ConciergeFlow` (7-step form) remains available at `/concierge` and as the
"structured questions" alternative inside the studio panel. Both UIs converge
on the same authoritative server path (`/api/concierge/evaluate` →
`/api/intake`), so there is one execution path for evaluation, storage, and
notification. If the conversational flow proves strictly better, the 7-step
UI can be retired without touching the server.

## Analytics (categorical only, no free text, no names/emails)

`front_office_opened / started / intent_selected / clarifying /
summary_reviewed / recommendation_shown / handoff_selected /
submit_started / submit_succeeded / submit_failed / abandoned / restarted`
with `host`, `route`, `intent`, `recommendation` (service or product slug),
`stage` properties, via the existing `trackStudioEvent` bridge.
