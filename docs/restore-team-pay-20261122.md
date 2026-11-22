# Restore team and payment routes

This branch integrates recovery commit
`596a25b8e8dcbf925cccb4362175feb575a528ce` with current main (`fc215e55`).
The recovered route trees include their authentication, affiliate ledger, call,
checkout, webhook, fulfillment, runtime assets, and tests. Main's privacy pages,
including Dreamcatcher Android and Health Connect, are preserved unchanged.

Preparation is confined to `restore/team-pay-20261122`, an isolated worktree, and
a Vercel preview. No production deployment or database migration is part of prep.
The existing production database already has the additive team/affiliate schema.

Local validation records and preview verification are retained under
`Evidence/restore-team-pay-20261122/` in the isolated worktree. PostgreSQL acceptance
tests use new loopback-only fixture databases under
`/Users/koi/rtp-20261122-Retained`; they do not connect to the application database.

## Go-live run-book — only after Blake approves the preview

1. Review the branch's final SHA and preview checks in the worker check-in. From
   this isolated worktree, fetch `origin/main` and confirm main has not advanced
   beyond the tested base. If it has, reconcile, rerun validation, and obtain
   approval of the updated preview before proceeding.
2. Open a pull request from `restore/team-pay-20261122` to `main`. Run the repository
   CI checks and review the complete restore diff. A formal work order is held for
   the Director; this preparation uses the explicitly authorized no-WO exception.
3. After Blake's explicit go-live approval, merge that reviewed SHA to `main`
   through GitHub. Do not switch or modify the dirty canonical checkout.
4. Vercel's connected project `koinophobia-labs`
   (`prj_vrNiN0q9vtV7YauZH4EaehQpUM4t`, team
   `team_GrnNjNAupVBmY91WucyLJOoV`) uses `main` as its production branch. Wait for
   the merge-triggered production deployment to reach READY; verify its Git SHA
   and that `koinophobialabs.com` resolves to that deployment. If automatic
   deployment fails or does not start, report it and retain the existing
   production alias; do not promote an unrelated deployment.
5. Check anonymous production GETs: `/team` returns 200;
   `/team/affiliate` and `/team/call` return 307 to `/team`; `/pay/fix`,
   `/pay/tune-up`, and `/pay/care` return 200. Verify team responses retain
   `X-Robots-Tag: noindex, nofollow, noarchive`.
6. Verify all eight privacy pages from main return 200: `/privacy`,
   `/dreamcatcher/privacy`, `/forget-about-it/privacy`, `/old-dog/privacy`,
   `/preaching-to-the-choir/privacy`, `/trendi/privacy`, `/way-in/privacy`, and
   `/you-know-ball/privacy`. Confirm Dreamcatcher's Android/Health Connect section.
7. Record the production deployment ID, merge SHA, route results, and approval in
   the follow-up work order/check-in. **No database migration is needed or allowed
   for this restoration.** Do not initiate payments, payouts, or email invites as
   part of these route checks.

Rollback, if needed, remains an owner-gated action: restore the previous production
deployment or revert the merge through GitHub. No schema rollback is required.
