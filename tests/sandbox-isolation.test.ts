import test from "node:test";
import assert from "node:assert/strict";
import { assertSandboxIsolation, sandboxBranch, sandboxEndpoint } from "../lib/sandbox-runtime";
const valid = { STRIPE_SANDBOX_E2E: "true", VERCEL_ENV: "preview", VERCEL_GIT_COMMIT_REF: sandboxBranch, STRIPE_CONNECT_MODE: "test", STRIPE_SECRET_KEY: "sk_test_fake_boundary_only", DATABASE_URL: `postgresql://test:test@${sandboxEndpoint}-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require`, DATABASE_URL_UNPOOLED: `postgresql://test:test@${sandboxEndpoint}.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require` };
test("isolated sandbox accepts only pinned preview, test key and empty-branch endpoint", () => {
 assert.doesNotThrow(() => assertSandboxIsolation(valid));
 for (const patch of [
   {VERCEL_ENV:"production"}, {VERCEL_GIT_COMMIT_REF:"main"}, {STRIPE_CONNECT_MODE:"live"},
   {STRIPE_SECRET_KEY:"sk_live_fake"}, {STRIPE_SECRET_KEY:""},
   {DATABASE_URL:"postgresql://test:test@ep-billowing-haze-atbq2s9a.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require"},
   {DATABASE_URL_UNPOOLED:"postgresql://localhost/neondb"}, {DATABASE_URL:valid.DATABASE_URL.replace("neondb?", "other?")},
   {DATABASE_URL:valid.DATABASE_URL.replace("require", "disable")},
 ]) assert.throws(() => assertSandboxIsolation({...valid,...patch}));
});
test("ordinary previews and production do not opt into the test exception", () => {
 assert.doesNotThrow(() => assertSandboxIsolation({VERCEL_ENV:"production"}));
 assert.doesNotThrow(() => assertSandboxIsolation({VERCEL_ENV:"preview"}));
});
