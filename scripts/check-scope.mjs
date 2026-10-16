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
  if (!branch.startsWith("studio/") && !branch.startsWith("codex/")) {
    console.log(`::notice::Scope check skipped for non-work-order branch ${JSON.stringify(branch)}.`);
    return;
  }

  const match = /^studio\/(WO-\d{4})-[^/\s]+$/.exec(branch);
  const wo = match?.[1];
  console.log(`Work order: ${wo || "unavailable (invalid branch name)"}`);
  const errors = [];
  let owned = [];
  let patterns = [];
  try {
    if (!wo) {
      throw new Error(`Invalid work-order branch ${JSON.stringify(branch)}. Use studio/WO-NNNN-* with a non-empty topic; codex/ branches are not allowed.`);
    }
    const scopeFile = `.studio/scope/${wo}.json`;
    let raw;
    try {
      // Read only this WO's committed manifest; local or other WO files cannot authorize a PR.
      raw = git("show", `HEAD:${scopeFile}`);
    } catch {
      throw new Error(`Missing committed ${scopeFile} on ${branch}. The Director must commit {"wo":"${wo}","owned":[...]} for this work order.`);
    }
    let scope;
    try {
      scope = JSON.parse(raw);
    } catch {
      throw new Error(`${scopeFile} must contain valid JSON.`);
    }
    if (Array.isArray(scope?.owned)) owned = scope.owned;
    if (!scope || scope.wo !== wo || !Array.isArray(scope.owned) || scope.owned.length === 0) {
      throw new Error(`${scopeFile} must declare wo ${wo} and a non-empty owned array.`);
    }
    patterns = owned.map(ownedPattern);
  } catch (error) {
    errors.push(error.message);
  }

  console.log("Owned globs:");
  for (const pattern of owned) console.log(`  - ${JSON.stringify(pattern)}`);
  if (!owned.length) console.log("  (none available)");
  console.log("Changed files (invalid or missing scope treats every file as unowned):");
  // NUL separators preserve unusual filenames; disabling renames checks the old path too.
  const changed = git("diff", "--name-only", "--no-renames", "-z", "origin/main...HEAD").split("\0").filter(Boolean);
  const outside = [];
  for (const file of changed) {
    const isOwned = patterns.some((pattern) => pattern.exec(file)?.[0] === file);
    console.log(`  ${isOwned ? "owned" : "unowned"}: ${JSON.stringify(file)}`);
    if (!isOwned) outside.push(file);
  }
  if (!changed.length) console.log("  (none)");
  if (outside.length) {
    errors.push(`${wo || "Invalid work-order branch"} changed files outside its owned paths:\n${outside.map((file) => `  - ${JSON.stringify(file)}`).join("\n")}`);
  }
  if (errors.length) throw new Error(errors.join("\n"));
  console.log(`Scope check passed for ${wo}: ${changed.length} changed file(s) are owned.`);
}

try {
  checkScope();
} catch (error) {
  console.error(`Scope check failed: ${error.message}`);
  process.exitCode = 1;
}
