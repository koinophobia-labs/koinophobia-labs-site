# Living Koi Companion Launch Gate

## Release decision

The living koi companion is ready for review as a draft pull request. It adds a contextual entrance to the existing AI Project Concierge without adding a second flow, router, price source, API contract, database migration, or credential.

## Architecture gate

- One root-mounted companion, governed by a deterministic route and host allowlist that includes Labs-owned Vercel previews for review.
- One shared `ConciergeFlow` for the companion and `/concierge`.
- One shared versioned draft, evaluation endpoint, intake handoff, CRM record, and Resend notification path.
- Deterministic recommendation remains authoritative; `OPENAI_API_KEY` remains optional.
- Panel and full concierge workflow are dynamically imported only after interaction.
- Companion UI preferences are session-only and contain no lead or answer content.
- Private, transactional, CRM, campaign, game, API, unknown, and full-page concierge routes are suppressed.
- No database migration and no production environment-variable change are required by this branch.

## Interaction and accessibility gate

- Keyboard operable trigger, dialog semantics, focus trap, Escape close, and focus restoration.
- Desktop side drawer and mobile bottom sheet respect viewport and safe-area boundaries.
- Runtime collision detection prevents the fixed koi from covering interactive page controls.
- Fine-pointer desktop movement follows the visitor across the full viewport, flips the speech bubble at viewport edges, and stops during typing, dialogs, touch input, or reduced motion.
- Basic site questions resolve through reviewed deterministic topics and source links; raw questions are not sent to analytics or an AI provider.
- Motion pauses when hidden, settles after inactivity, and removes repeated swimming under reduced motion.
- Automated WCAG 2 A/AA checks pass for the open mobile experience.
- The standard intake and the full-page concierge remain available throughout.

## Performance gate

- The contextual menu and deterministic site guide share a lazy chunk: 16,808 bytes raw, 6,467 bytes gzip in the release build.
- The heavier shared concierge workflow remains behind a second dynamic boundary.
- No chat framework, model client SDK, or new font/image payload was added.
- The koi illustration reuses the repo's existing code-native fish geometry.

Chunk filenames are build hashes and may change. The size evidence above is from the final local production build and is intended as an order-of-magnitude release check, not a permanent budget assertion.

## Verification matrix

The release branch must remain green for:

```text
npm run test:concierge
npm run test:crm
npm run test:commercial
npm run test:dev-routing
npm run test:now
npm run test:release-qa
npm run test:concierge:e2e
npm run test:koi-companion:e2e
npx tsc --noEmit
npm run lint
npm run build
```

The visual capture matrix contains 17 screenshots across 320, 390, 768, 1024, 1440, and 1920 pixel widths, representative page contexts, active pointer following, a deterministic site answer, open menu/question states, keyboard focus, and reduced motion. The capture metrics report no horizontal overflow.

Final local results on 2026-07-18:

| Gate | Result |
| --- | --- |
| Concierge unit/integration, including companion and site-guide rules | 45/45 pass |
| CRM and adjacent production regressions | 58/58 pass |
| Commercial contract | 6/6 pass |
| Dual-domain routing | 15/15 pass |
| `/now` regressions | 11/11 pass |
| Release browser QA | 50/50 pass |
| Existing concierge Chromium E2E | 12/12 pass |
| Companion Chromium/WebKit E2E | 34/34 pass |
| TypeScript | pass |
| ESLint | 0 errors; one pre-existing `_random` warning in `lib/trendiHero.ts` |
| Next.js production build | pass; 39 pages generated |

Routes visually inspected: `/`, `/services`, `/work`, `/products`, `/audit`, and `/intake`. Suppression was exercised on `/concierge`, `/crm`, `/crm/login`, `/crm/leads/example`, `/payment/success`, `/trendi`, and `/you-know-ball/play`. Host tests also cover the Labs production domain, localhost, and suppression on `koinophobia.dev`.

Visual states inspected: free full-viewport pointer following, resting, edge-aware invitation speech bubble, site-question answer, contextual menu, long question, focused mobile free-text input, and reduced motion. Desktop drawer and mobile bottom-sheet results passed without viewport overflow. The deterministic AI-unavailable journey completed with its fallback disclosure, and a draft resumed after minimizing, route navigation, refresh, and continuation to `/concierge`.

## Remaining blockers and recommendation

There are no known code, migration, credential, accessibility, or browser blockers. Real production CRM/Resend delivery and real-device confirmation remain post-deployment smoke responsibilities because they require production credentials and external state.

Recommendation: approve the draft PR after CI reproduces the matrix, merge through the repository's normal review policy, allow the Vercel Git deployment, and immediately execute the controlled production smoke below.

## Production smoke after merge

1. Confirm the koi is present on approved public routes and absent from `/concierge`, `/crm`, payment, campaign, and game routes.
2. Complete one deterministic companion journey with AI unavailable.
3. Minimize or refresh midway and confirm the shared draft resumes.
4. Continue to the standard intake and submit a controlled test business.
5. Confirm the lead appears correctly in `/crm` and the Resend notification has the expected reply-to behavior.
6. Confirm an Audit recommendation reaches the existing audit flow and does not create a Stripe checkout.
7. Verify mobile CTA collision avoidance and reduced-motion behavior on a real device.

Production deployment remains owned by the existing Vercel Git workflow. This branch should be reviewed and merged through that workflow; it does not perform a direct deployment.
