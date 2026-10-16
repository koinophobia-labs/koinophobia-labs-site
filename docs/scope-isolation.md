# Work-order scope isolation

For `studio/WO-NNNN-<topic>` PRs, the Director commits `.studio/scope/WO-NNNN.json`:
`{"wo":"WO-NNNN","owned":["components/apps/**",".studio/scope/WO-NNNN.json"]}`.
The branch ID, filename and `wo` must match; `owned` must be a non-empty list of repo-relative paths.
Each work order has its own manifest so parallel PRs do not share a scope file.
Globs support `*` (within one segment), `?` (one character), and `**` (whole segments, recursively).
Patterns include dotfiles; absolute paths, parent traversal, braces, classes and negation are rejected.
CI checks the committed PR head against `origin/main...HEAD`, including deletions and both rename paths.
Every changed file must be owned, including the manifest; missing or invalid scope fails closed.
Logs show the WO, every declared glob and every changed file as owned/unowned, even on failure.
Malformed `studio/` and all `codex/` branches fail; other branches skip with a notice.
Run locally after committing: `git fetch origin main && node scripts/check-scope.mjs`.
CI uses `GITHUB_HEAD_REF`; locally the script reads the current Git branch.
Run `npx tsx --test tests/scope.test.ts`; fixtures use cleaned OS temp directories. The Director reviews ownership.
