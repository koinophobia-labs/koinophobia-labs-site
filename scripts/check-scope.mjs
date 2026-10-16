#!/usr/bin/env node
import { execFileSync } from "node:child_process";

function git(...args) {
  return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function ownedPattern(pattern) {
  if (typeof pattern !== "string" || !pattern || pattern.startsWith("/") ||
      pattern.split("/").some((part) => !part || part === "." || part === "..") ||
      /[\\\[\]{}()!]/.test(pattern) || pattern.split("/").some((part) => part.includes("**") && part !== "**")) {
    throw new Error(`Invalid owned glob ${JSON.stringify(pattern)}: use repo-relative paths with *, ** or ?.`);
  }
  const parts = pattern.split("/");
  return new RegExp("^" + parts.map((part, index) => {
    const last = index === parts.length - 1;
    if (part === "**") return last ? ".*" : "(?:[^/]+/)*";
    return part.replace(/[.+^$|]/g, "\\$&").replace(/\*/g, "[^/]*").replace(/\?/g, "[^/]") + (last ? "" : "/");
  }).join("") + "$", "s");
}

function checkScope() {
  const branch = process.env.GITHUB_HEAD_REF || git("branch", "--show-current").trim();
  if (!branch.startsWith("studio/")) {
    console.log(`::notice::Scope check skipped for non-work-order branch ${JSON.stringify(branch)}.`);
    return;
  }

  let raw;
  try {
    // Read the committed manifest; an untracked/local file must never authorize a PR.
    raw = git("show", "HEAD:.studio/scope.json");
  } catch {
    throw new Error(`Missing committed .studio/scope.json on ${branch}. The Director must commit {"wo":"WO-NNNN","owned":[...]} for this work order.`);
  }
  const match = /^studio\/(WO-\d{4})-.+$/.exec(branch);
  if (!match) {
    console.log(`::notice::Scope check skipped for non-work-order branch ${JSON.stringify(branch)}.`);
    return;
  }

  let scope;
  try {
    scope = JSON.parse(raw);
  } catch {
    throw new Error(".studio/scope.json must contain valid JSON.");
  }
  if (!scope || scope.wo !== match[1] || !Array.isArray(scope.owned) || scope.owned.length === 0) {
    throw new Error(`.studio/scope.json must declare wo ${match[1]} and a non-empty owned array.`);
  }
  const patterns = scope.owned.map(ownedPattern);
  // NUL separators preserve unusual filenames; disabling renames checks the old path too.
  const changed = git("diff", "--name-only", "--no-renames", "-z", "origin/main...HEAD").split("\0").filter(Boolean);
  const outside = changed.filter((file) => !patterns.some((pattern) => pattern.exec(file)?.[0] === file));
  if (outside.length) {
    throw new Error(`${match[1]} changed files outside its owned paths:\n${outside.map((file) => `  - ${JSON.stringify(file)}`).join("\n")}`);
  }
  console.log(`Scope check passed for ${match[1]}: ${changed.length} changed file(s) are owned.`);
}

try {
  checkScope();
} catch (error) {
  console.error(`Scope check failed: ${error.message}`);
  process.exitCode = 1;
}
