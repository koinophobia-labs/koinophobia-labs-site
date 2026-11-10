// Temporary WO-0258 E2E environment. These identities are pinned from the
// schema-only branch creation receipt, never inferred from inherited URLs.
export const sandboxBranch = "codex/connect-sandbox-e2e-20261110";
export const sandboxAccount = "acct_1To6wmBogFmoWfLU";
export const sandboxEndpoint = "ep-wandering-base-atsyrnmr";
export const sandboxRequested = () => process.env.STRIPE_SANDBOX_E2E === "true";
export function assertSandboxIsolation(env: Record<string, string | undefined> = process.env) {
  if (env.STRIPE_SANDBOX_E2E !== "true") return;
  if (env.VERCEL_ENV !== "preview" || env.VERCEL_GIT_COMMIT_REF !== sandboxBranch)
    throw Error("SANDBOX_PREVIEW_BRANCH_REQUIRED");
  if (env.STRIPE_CONNECT_MODE !== "test" || !/^(sk|rk)_test_/.test(env.STRIPE_SECRET_KEY || ""))
    throw Error("SANDBOX_TEST_KEY_REQUIRED");
  for (const key of ["DATABASE_URL", "DATABASE_URL_UNPOOLED"]) {
    let url: URL;
    try { url = new URL(env[key] || ""); } catch { throw Error("SANDBOX_DATABASE_REQUIRED"); }
    if (!["postgres:", "postgresql:"].includes(url.protocol) ||
      ![`${sandboxEndpoint}.c-9.us-east-1.aws.neon.tech`, `${sandboxEndpoint}-pooler.c-9.us-east-1.aws.neon.tech`].includes(url.hostname) ||
      url.pathname !== "/neondb" || !["require", "verify-full", "verify-ca"].includes(url.searchParams.get("sslmode") || ""))
      throw Error("SANDBOX_DATABASE_ISOLATION_REQUIRED");
  }
}
export function sandboxPreview() {
  if (!sandboxRequested()) return false;
  assertSandboxIsolation();
  return true;
}
