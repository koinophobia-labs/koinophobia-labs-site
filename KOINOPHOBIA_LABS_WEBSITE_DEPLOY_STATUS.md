# Koinophobia Labs Website Deploy Status

Final verdict: WEBSITE_PUBLISHED

## Production URL

- Stable production URL: https://koinophobia-labs.vercel.app
- Latest deployment URL: https://koinophobia-labs-o5hpmsk89-koinophobia999-8829s-projects.vercel.app
- Vercel project: koinophobia999-8829s-projects/koinophobia-labs

## Validation Results

- `npm run lint`: passed
- `npm run build`: passed
- Desktop browser smoke: passed
- 430px browser smoke: passed locally before deploy
- 390px browser smoke: passed locally and on production
- Homepage loads on production: passed
- All seven sections present and ordered: `top`, `products`, `lab`, `proof`, `services`, `about`, `contact`
- No console errors in browser smoke tests
- No dead `href="#"` links found
- GitHub and LinkedIn placeholders safely fall back to `#contact`
- Contact form validation works
- Contact submit reaches success state and uses mailto wiring for `koinophobia999@gmail.com`
- OG metadata is present
- `https://koinophobia-labs.vercel.app/og.png` returns HTTP 200
- You Know Ball section reads as the flagship product
- No sportsbook/casino styling added
- No employer-drama copy added
- No secrets exposed

## Copy Truth-Check Changes

Updated TestFlight wording to avoid overclaiming readiness or availability:

- Replaced `You Know Ball live on TestFlight` with `iOS TestFlight build uploaded`
- Replaced `Uploaded to TestFlight` with `iOS build 1.0 (4) uploaded`
- Replaced `TestFlight upload` receipt copy with `iOS build uploaded for processing`
- Replaced Proof receipt title `You Know Ball -> TestFlight` with `You Know Ball -> App Store Connect`
- Updated Proof receipt description to: `iOS build 1.0 (4) uploaded for TestFlight processing. Public App Store review has not been submitted.`
- Updated status chip from `TestFlight build` to `TestFlight processing`
- Added receipt language: `TestFlight access pending Apple processing`

The site still accurately includes:

- Vercel web MVP shipped
- Guardrail red-team: 80 prompts, 0 hard violations
- Live quick-gate passed
- iOS build 1.0 (4) uploaded to App Store Connect for TestFlight processing
- Guardrails active / not betting advice

## Deployment Result

Deployed to Vercel production from the correct project root:

`/Users/koi/Documents/Codex/2026-06-06/do-this-exactly-koinophobia-labs-codex/koinophobia-labs`

Deployment command used:

```bash
npx vercel --prod
```

The project was linked as a new Vercel project named `koinophobia-labs`, then redeployed after setting metadata to the live Vercel URL so Open Graph assets resolve immediately.

## Known Placeholders Still Needing Replacement

- `public/og.png` is a safe placeholder and should be replaced with the final social share image.
- About portrait is still a designed placeholder.
- You Know Ball screenshots/mockups are still placeholder assets.
- `LINKS.linkedin` is empty and falls back to `#contact`.
- `LINKS.github` is empty and falls back to `#contact`.
- `LINKS.ykbTestflight` is empty and falls back to `#contact`.
- `LINKS.ykbDemo` is empty and falls back to `#contact`.

## Next Polish Items

- Replace `public/og.png`
- Add real Blake portrait
- Add You Know Ball screenshots
- Fill `LINKS.linkedin`
- Fill `LINKS.github`
- Fill `LINKS.ykbTestflight` once TestFlight is ready
- Fill `LINKS.ykbDemo` with the desired public/private demo URL
- When the custom domain is connected, update `metadataBase` in `app/layout.tsx` from `https://koinophobia-labs.vercel.app` to the final production domain.

## Launch Blockers

None.

