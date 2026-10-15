// Preserve the existing migration suite's local database fixture as test
// evidence. This changes cleanup only; test assertions and database I/O run
// unchanged. Load with --import before the test runner.
import fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import { join } from "node:path";
import { tmpdir } from "node:os";
const remove = fs.rmSync;
fs.rmSync = function (path, options) {
  if (String(path).startsWith(join(tmpdir(), "koinophobia-migration-test-"))) {
    console.log(`Retained migration test fixture: ${path}`);
    return;
  }
  return remove(path, options);
};
syncBuiltinESMExports();
