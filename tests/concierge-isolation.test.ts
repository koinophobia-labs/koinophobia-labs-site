import assert from "node:assert/strict";
import test from "node:test";
import {
  clearConciergeDraft,
  CONCIERGE_LEGACY_MIGRATION_KEY,
  CONCIERGE_STORAGE_KEY,
  loadConciergeDraft,
  loadConciergeDraftForSession,
  saveConciergeDraft,
  type ConciergeStorage,
} from "../lib/concierge/session";
import type { ConciergeDraft } from "../lib/concierge/types";

class MemoryStorage implements ConciergeStorage {
  readonly values = new Map<string, string>();

  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

const visitorAId = "00000000-0000-4000-8000-0000000000a1";
const visitorBId = "00000000-0000-4000-8000-0000000000b2";

function draft(sessionId: string, savedAt = Date.now()): ConciergeDraft {
  return {
    version: 1,
    sessionId,
    savedAt,
    step: 1,
    stage: "questions",
    answers: { businessName: sessionId === visitorAId ? "Visitor A Business" : "Visitor B Business" },
  };
}

test("a draft survives route changes in the same browser tab", () => {
  const tab = new MemoryStorage();
  saveConciergeDraft(tab, draft(visitorAId));
  assert.equal(loadConciergeDraft(tab)?.answers.businessName, "Visitor A Business");
});

test("two tabs on one browser origin cannot see each other's concierge drafts", () => {
  const sharedLocalStorage = new MemoryStorage();
  const visitorATab = new MemoryStorage();
  const visitorBTab = new MemoryStorage();
  saveConciergeDraft(visitorATab, draft(visitorAId));
  saveConciergeDraft(visitorBTab, draft(visitorBId));
  assert.equal(loadConciergeDraft(visitorATab, sharedLocalStorage)?.sessionId, visitorAId);
  assert.equal(loadConciergeDraft(visitorBTab, sharedLocalStorage)?.sessionId, visitorBId);
});

test("a foreign concierge handoff identifier is rejected", () => {
  const tab = new MemoryStorage();
  saveConciergeDraft(tab, draft(visitorAId));
  assert.equal(loadConciergeDraftForSession(tab, visitorBId), null);
  assert.equal(loadConciergeDraftForSession(tab, visitorAId)?.sessionId, visitorAId);
});

test("upgrade migration deletes unowned origin-wide drafts", () => {
  const legacy = new MemoryStorage();
  const tab = new MemoryStorage();
  legacy.setItem(CONCIERGE_STORAGE_KEY, JSON.stringify(draft(visitorAId)));
  assert.equal(loadConciergeDraft(tab, legacy), null);
  assert.equal(legacy.getItem(CONCIERGE_STORAGE_KEY), null);
  assert.equal(legacy.getItem(CONCIERGE_LEGACY_MIGRATION_KEY), "1");
});

test("successful handoff cleanup removes only the current tab draft", () => {
  const visitorATab = new MemoryStorage();
  const visitorBTab = new MemoryStorage();
  saveConciergeDraft(visitorATab, draft(visitorAId));
  saveConciergeDraft(visitorBTab, draft(visitorBId));
  clearConciergeDraft(visitorATab);
  assert.equal(loadConciergeDraft(visitorATab), null);
  assert.equal(loadConciergeDraft(visitorBTab)?.sessionId, visitorBId);
});

test("unavailable browser storage fails closed", () => {
  const unavailable: ConciergeStorage = {
    getItem() { throw new Error("storage unavailable"); },
    setItem() { throw new Error("storage unavailable"); },
    removeItem() { throw new Error("storage unavailable"); },
  };
  assert.equal(loadConciergeDraft(unavailable, unavailable), null);
  assert.equal(saveConciergeDraft(unavailable, draft(visitorAId)), false);
});
