# Koinophobia Labs Public Posting Ready Status

Final verdict: PUBLIC_POSTING_READY

## Production URL

- Stable production URL: https://koinophobia-labs.vercel.app
- Latest deployment URL: https://koinophobia-labs-i6zscczpp-koinophobia999-8829s-projects.vercel.app
- Vercel project: koinophobia999-8829s-projects/koinophobia-labs

## Links Updated

Centralized link source: `lib/links.ts`

- Email: `mailto:koinophobia999@gmail.com`
- Koinophobia Labs site: `https://koinophobia-labs.vercel.app`
- Instagram: `https://instagram.com/b.la.ke7`
- TikTok: `https://www.tiktok.com/@.koinophobia`
- You Know Ball demo/live app: `https://you-know-ball-hvlm2etge-koinophobia999-8829s-projects.vercel.app`
- GitHub: placeholder; safely falls back to `#contact`
- LinkedIn: placeholder; safely falls back to `#contact`
- You Know Ball TestFlight link: placeholder; safely falls back to `#contact` until TestFlight is confirmed ready

## CTAs Verified

- `View Products` -> `#products`
- `Work With Me` -> `#contact`
- `Request You Know Ball Access` -> `#contact`
- `Live web demo` -> current You Know Ball Vercel app URL
- Service card `Start a build` CTAs -> `#contact`
- CTA bar `Send a project idea` -> `#contact`
- Proof `Work with me` -> `#contact`
- GitHub/LinkedIn placeholders display soon affordances and route to contact
- No dead `href="#"` links found in browser smoke checks

## Contact Form Status

- Contact form remains mailto-based for v1.
- Empty submit validates and shows inline errors.
- Filled submit opens a mailto flow to `koinophobia999@gmail.com`.
- Subject line: `Koinophobia Labs inquiry: {project type}`
- Body includes name, email/handle, project type, and message.
- Success state displays: `Message received. KOI logged it…`
- Fallback note added: `If the form does not open your email app, email me directly at koinophobia999@gmail.com.`

## Proof Language Truth-Check

No TestFlight overclaiming remains.

Accurate proof language present:

- `iOS build 1.0 (4) uploaded for TestFlight processing`
- `Public App Store review has not been submitted`
- `Vercel web MVP shipped`
- `Guardrail red-team: 80 prompts · 0 violations`
- `80 / 0`
- `Live quick-gate passed`
- `TestFlight access pending Apple processing`
- `Betting guardrails active`
- `NOT A SPORTSBOOK · NOT BETTING ADVICE · NOT PICKS OR PARLAYS`

Avoided language:

- No `live on TestFlight`
- No `available on TestFlight`
- No `TestFlight live`
- No `TestFlight private beta ready`
- No `App Store ready`
- No `Public beta`

## SEO / OG Status

- Metadata title: `Koinophobia Labs — AI Products, Creator Systems, and Proof`
- Metadata description: `Koinophobia Labs is Blake Taylor’s product studio for AI tools, creator systems, sports debate products, and command-center interfaces. Built, tested, shipped.`
- OG image: `https://koinophobia-labs.vercel.app/og.png`
- Twitter card metadata is present.
- `https://koinophobia-labs.vercel.app/og.png` returns HTTP 200.
- `public/og.png` is still a safe placeholder and should be replaced with a custom OG image later.

## Mobile Smoke Results

Local browser smoke:

- Desktop: passed
- 430px: passed
- 390px: passed
- No horizontal overflow
- Mobile nav visible and usable
- Hero reads correctly
- Proof strip and proof receipts render
- You Know Ball reads as flagship
- Service cards are clear
- Contact form is usable
- No console errors

Production browser smoke:

- Desktop: passed
- 430px: passed
- 390px: passed
- Homepage returns HTTP 200
- You Know Ball demo URL returns HTTP 200
- OG asset returns HTTP 200
- No horizontal overflow
- No console errors
- GitHub and LinkedIn placeholders safely fall back to contact

## Validation Results

- `npm run lint`: passed
- `npm run build`: passed
- `npm audit --omit=dev`: reports 2 moderate advisories through Next/PostCSS.
  - No fix applied.
  - `npm audit fix --force` would downgrade Next and was intentionally not run.

## Deployment Result

Redeployed to Vercel production from the correct project root:

`/Users/koi/Documents/Codex/2026-06-06/do-this-exactly-koinophobia-labs-codex/koinophobia-labs`

Deployment command:

```bash
npx vercel --prod
```

Stable alias after deploy:

`https://koinophobia-labs.vercel.app`

## Remaining Nice-To-Haves

- Custom domain
- Custom OG image
- Real Blake portrait
- Real You Know Ball screenshots
- Real GitHub URL
- Real LinkedIn URL
- Resend/Formspree contact backend
- Update TestFlight link/status when ready

## Launch Blockers

None.

