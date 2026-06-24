# Koinophobia Labs Site

Source repo for the Koinophobia Labs portfolio and services site.

## Summary

Koinophobia Labs is a founder-led product and build studio for AI tools, creator systems, service websites, and practical workflow products.

This rebuilt source project preserves the public positioning of the existing live site while creating a maintainable GitHub-backed Next.js codebase.

## Features

- Responsive landing page
- Product Lab section
- Shipped Tools section
- Career Forge Lite link card
- Services and concepts sections
- Contact CTA
- No backend or database
- No fake metrics or inflated claims

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- App Router

## Local Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Verification

```bash
npm run lint
npm run typecheck
npm run build
```

## Deployment

Push this repo to GitHub as `koinophobia-labs-site`, then connect it to the Vercel project currently serving:

`https://koinophobia-labs.vercel.app`

Use the Vercel dashboard to set the production branch and redeploy.

## Current Limitations

- Static site only
- No CMS
- No backend contact form
- No analytics added
- No source migration from the existing live site was possible because the original source repo was not found
