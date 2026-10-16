# Work-order scope isolation

For `studio/WO-NNNN-*` PRs, the Director commits `.studio/scope.json`:
`{"wo":"WO-NNNN","owned":["components/apps/**",".studio/**"]}`.
`wo` must match the branch; `owned` must be a non-empty list of repository-relative paths.
Globs support `*` (within one segment), `?` (one character), and `**` (whole segments, recursively).
Patterns include dotfiles; absolute paths, parent traversal, braces, classes and negation are rejected.
CI checks the committed PR head against `origin/main...HEAD`, including deletions and both rename paths.
Every changed file must be owned, including `.studio/scope.json`; failures list unowned files.
Every `studio/` branch requires a committed scope file; other non-work-order branches skip with a notice.
Run locally after committing: `git fetch origin main && node scripts/check-scope.mjs`.
CI uses `GITHUB_HEAD_REF`; locally the script reads the current Git branch.
Run regression tests: `npx tsx --test tests/scope.test.ts`.
The Director reviews declared ownership; this check does not independently authorize scope expansion.
