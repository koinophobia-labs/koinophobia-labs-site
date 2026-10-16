import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import test, { afterEach } from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const script = path.join(root, "scripts/check-scope.mjs");
// Disposable synthetic repositories live outside the project and are removed after each test.
const fixtures: string[] = [];
afterEach(() => {
  for (const cwd of fixtures.splice(0)) {
    rmSync(cwd, { recursive: true, force: true });
    assert.equal(existsSync(cwd), false, `Temporary fixture was not removed: ${cwd}`);
  }
});
const wo0128 = { wo: "WO-0128", owned: ["components/apps/**", ".studio/**"] };

function fixture({
  branch = "studio/WO-0134-scope-check",
  scope = { wo: "WO-0134", owned: ["lib/app-homes.ts", ".studio/**"] } as unknown,
  scopeFile = `.studio/scope/${/^studio\/(WO-\d{4})-/.exec(branch)?.[1] || "WO-0134"}.json`,
  changes = { "lib/app-homes.ts": "export const changed = true;\n" } as Record<string, string>,
} = {}) {
  const cwd = mkdtempSync(path.join(tmpdir(), "wo-0134-scope-test-"));
  fixtures.push(cwd);
  const git = (...args: string[]) => execFileSync("git", args, {
    cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
  });
  const write = (file: string, text: string) => {
    mkdirSync(path.dirname(path.join(cwd, file)), { recursive: true });
    writeFileSync(path.join(cwd, file), text);
  };
  const commit = () => git("-c", "core.hooksPath=/dev/null", "-c", "commit.gpgsign=false", "commit", "-qm", "fixture");
  git("init", "-q", "-b", "main");
  git("config", "user.name", "Scope fixture");
  git("config", "user.email", "scope@example.invalid");
  write("app/globals.css", "body { font-family: serif; }\n");
  write("lib/app-homes.ts", "export const changed = false;\n");
  git("add", ".");
  commit();
  git("update-ref", "refs/remotes/origin/main", "HEAD");
  git("checkout", "-qb", branch);
  if (scope !== null) write(scopeFile, JSON.stringify(scope));
  for (const [file, text] of Object.entries(changes)) write(file, text);
  git("add", ".");
  commit();
  const run = (headRef = "") => spawnSync(process.execPath, [script], {
    cwd, encoding: "utf8", env: { ...process.env, GITHUB_HEAD_REF: headRef },
  });
  return { cwd, git, write, commit, run };
}

function passes(result: ReturnType<ReturnType<typeof fixture>["run"]>) {
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Scope check passed/);
}

function fails(result: ReturnType<ReturnType<typeof fixture>["run"]>, message: RegExp) {
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stderr, message);
}

test("in-scope committed changes pass", () => {
  passes(fixture().run());
});

test("out-of-scope changes fail and name every offending file", () => {
  const result = fixture({ changes: { "app/globals.css": "changed", "app/layout.tsx": "changed" } }).run();
  fails(result, /app\/globals\.css/);
  assert.match(result.stderr, /app\/layout\.tsx/);
});

test("recursive globs include direct, nested and dotfile paths", () => {
  passes(fixture({ scope: wo0128, branch: "studio/WO-0128-apps", changes: {
    "components/apps/Card.tsx": "card", "components/apps/deep/Card.tsx": "card", "components/apps/.settings": "settings",
  } }).run());
});

test("WO-0128 regression fixture: app ownership cannot change the site font", () => {
  fails(fixture({ scope: wo0128, branch: "studio/WO-0128-apps", changes: {
    "app/globals.css": "body { font-family: sans-serif; }\n",
  } }).run(), /WO-0128 changed files outside its owned paths:[\s\S]*app\/globals\.css/);
});

test("single-segment star and question-mark globs work", () => {
  passes(fixture({ scope: { wo: "WO-0134", owned: ["lib/*.ts", "docs/v?.md", ".studio/**"] },
    changes: { "lib/app-homes.ts": "changed", "docs/v1.md": "text" } }).run());
});

test("single star does not cross directory boundaries", () => {
  fails(fixture({ scope: { wo: "WO-0134", owned: ["components/apps/*", ".studio/**"] },
    changes: { "components/apps/nested/Card.tsx": "card" } }).run(), /nested\/Card\.tsx/);
});

test("globstar can match zero directories and patterns stay anchored", () => {
  const repo = fixture({ scope: { wo: "WO-0134", owned: ["lib/**/app-homes.ts", ".studio/**"] } });
  passes(repo.run());
  repo.write("other/lib/app-homes.ts", "outside");
  repo.git("add", "."); repo.commit();
  fails(repo.run(), /other\/lib\/app-homes\.ts/);
});

test("missing committed scope file fails clearly", () => {
  fails(fixture({ scope: null }).run(), /Missing committed \.studio\/scope\/WO-0134\.json/);
});

test("untracked scope file cannot authorize committed changes", () => {
  const repo = fixture({ scope: null });
  repo.write(".studio/scope/WO-0134.json", JSON.stringify({ wo: "WO-0134", owned: ["**"] }));
  fails(repo.run(), /Missing committed/);
});

test("non-studio branch skips without a scope file", () => {
  const result = fixture({ branch: "fix/home", scope: null }).run();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /::notice::Scope check skipped/);
});

test("malformed studio branches fail with or without a manifest", () => {
  for (const branch of ["studio/maintenance", "studio/WO-0134", "studio/WO-0134-", "studio/WO-134-topic", "studio/WO-01345-topic", "studio/WO-0134-topic/nested"]) {
    for (const scope of [null, { wo: "WO-0134", owned: ["**"] }]) {
      const result = fixture({ branch, scope }).run();
      fails(result, /Use studio\/WO-NNNN-\*/);
      assert.doesNotMatch(result.stdout, /Scope check skipped/);
      assert.match(result.stdout, /Work order: unavailable/);
      assert.match(result.stdout, /unowned: "lib\/app-homes\.ts"/);
    }
  }
});

test("codex branches fail even with a manifest", () => {
  for (const branch of ["codex/fix", "codex/WO-0134-scope-check"]) {
    for (const scope of [null, { wo: "WO-0134", owned: ["**"] }]) {
      fails(fixture({ branch, scope }).run(), /Use studio\/WO-NNNN-\*.*codex\/ branches are not allowed/);
    }
  }
});

test("scope work-order ID must match the branch", () => {
  fails(fixture({ scope: wo0128 }).run(), /must declare wo WO-0134/);
});

test("malformed JSON fails", () => {
  const repo = fixture();
  repo.write(".studio/scope/WO-0134.json", "{"); repo.git("add", "."); repo.commit();
  fails(repo.run(), /must contain valid JSON/);
});

test("invalid manifest shapes and unsafe glob patterns fail closed", () => {
  for (const scope of [null, {}, { wo: "WO-0134", owned: [] }, { wo: "WO-0134", owned: "**" },
    ...[42, "", "../**", "/app/**", "app//**", "app/**.css", "!app/**", "{app,lib}/**"].map((pattern) => ({ wo: "WO-0134", owned: [pattern] }))]) {
    const repo = fixture();
    repo.write(".studio/scope/WO-0134.json", JSON.stringify(scope)); repo.git("add", "."); repo.commit();
    fails(repo.run(), /must declare|Invalid owned glob/);
  }
});

test("scope manifest itself must be explicitly owned", () => {
  fails(fixture({ scope: { wo: "WO-0134", owned: ["lib/app-homes.ts"] } }).run(), /\.studio\/scope\/WO-0134\.json/);
});

test("deleted files are checked", () => {
  const repo = fixture();
  repo.git("update-index", "--force-remove", "app/globals.css"); repo.commit();
  fails(repo.run(), /app\/globals\.css/);
});

test("renaming an unowned file into an owned directory fails on its old path", () => {
  const repo = fixture({ scope: { wo: "WO-0134", owned: ["lib/**", ".studio/**"] } });
  repo.git("mv", "app/globals.css", "lib/moved.css"); repo.commit();
  fails(repo.run(), /app\/globals\.css/);
});

test("GITHUB_HEAD_REF checks detached PR heads", () => {
  const repo = fixture();
  repo.git("checkout", "--detach");
  passes(repo.run("studio/WO-0134-scope-check"));
});

test("filenames containing tabs or newlines cannot evade the check", () => {
  const result = fixture({ changes: { "app/tab\tname\n.css": "changed" } }).run();
  fails(result, /app\/tab\\tname\\n\.css/);
});

test("merge-base diff ignores changes made only on main", () => {
  const repo = fixture();
  repo.git("checkout", "main");
  repo.write("app/globals.css", "main-only change"); repo.git("add", "."); repo.commit();
  repo.git("update-ref", "refs/remotes/origin/main", "HEAD");
  repo.git("checkout", "studio/WO-0134-scope-check");
  passes(repo.run());
});

test("missing base history fails rather than silently passing", () => {
  const repo = fixture();
  repo.git("update-ref", "-d", "refs/remotes/origin/main");
  fails(repo.run(), /origin\/main\.\.\.HEAD/);
});


test("exact owned paths cannot match filenames with a trailing newline", () => {
  fails(fixture({ changes: { "lib/app-homes.ts\n": "outside" } }).run(), /app-homes\.ts\\n/);
});

test("recursive ownership includes unusual filenames within its directory", () => {
  passes(fixture({ scope: wo0128, branch: "studio/WO-0128-apps", changes: {
    "components/apps/line\nbreak.tsx": "card",
  } }).run());
});

test("scope filename must match the branch even when the wo field matches", () => {
  fails(fixture({ scopeFile: ".studio/scope/WO-0128.json" }).run(), /Missing committed \.studio\/scope\/WO-0134\.json/);
});

test("legacy shared scope file cannot authorize a work order", () => {
  fails(fixture({ scopeFile: ".studio/scope.json" }).run(), /Missing committed \.studio\/scope\/WO-0134\.json/);
});

test("parallel work-order manifests coexist without changing this WO's ownership", () => {
  const repo = fixture();
  repo.write(".studio/scope/WO-0128.json", JSON.stringify(wo0128));
  repo.git("add", "."); repo.commit();
  passes(repo.run());
  repo.write("components/apps/Card.tsx", "outside WO-0134");
  repo.git("add", "."); repo.commit();
  fails(repo.run(), /components\/apps\/Card\.tsx/);
});

test("CI logs the WO, every glob and every changed file on pass and failure", () => {
  const repo = fixture();
  const passed = repo.run();
  passes(passed);
  assert.match(passed.stdout, /Work order: WO-0134/);
  for (const glob of ["lib/app-homes.ts", ".studio/**"]) {
    assert.ok(passed.stdout.includes(`  - ${JSON.stringify(glob)}`));
  }
  for (const file of [".studio/scope/WO-0134.json", "lib/app-homes.ts"]) {
    assert.ok(passed.stdout.includes(`  owned: ${JSON.stringify(file)}`));
  }
  repo.write("app/globals.css", "out of scope");
  repo.git("add", "."); repo.commit();
  const failed = repo.run();
  fails(failed, /app\/globals\.css/);
  assert.match(failed.stdout, /Work order: WO-0134/);
  for (const glob of ["lib/app-homes.ts", ".studio/**"]) {
    assert.ok(failed.stdout.includes(`  - ${JSON.stringify(glob)}`));
  }
  for (const file of [".studio/scope/WO-0134.json", "lib/app-homes.ts"]) {
    assert.ok(failed.stdout.includes(`  owned: ${JSON.stringify(file)}`));
  }
  assert.match(failed.stdout, /  unowned: "app\/globals\.css"/);
});

test("invalid manifests still log every declared glob and changed file", () => {
  const result = fixture({ scope: { wo: "WO-0128", owned: ["**", "lib/**"] } }).run();
  fails(result, /must declare wo WO-0134/);
  assert.match(result.stdout, /Work order: WO-0134/);
  assert.ok(result.stdout.includes('  - "**"'));
  assert.ok(result.stdout.includes('  - "lib/**"'));
  assert.match(result.stdout, /  unowned: "lib\/app-homes\.ts"/);
  assert.match(result.stdout, /  unowned: "\.studio\/scope\/WO-0134\.json"/);
});

test("missing scope still logs the WO and every changed file as unowned", () => {
  const result = fixture({ scope: null }).run();
  fails(result, /Missing committed/);
  assert.match(result.stdout, /Work order: WO-0134/);
  assert.match(result.stdout, /Owned globs:\n  \(none available\)/);
  assert.match(result.stdout, /  unowned: "lib\/app-homes\.ts"/);
});

test("fixtures are created under the OS temporary directory", () => {
  const repo = fixture();
  assert.equal(path.dirname(repo.cwd), tmpdir());
  assert.ok(!repo.cwd.startsWith(root + path.sep));
});
