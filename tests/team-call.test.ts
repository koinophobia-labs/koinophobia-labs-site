import test from "node:test";
import assert from "node:assert/strict";
import {
  newDealCode,
  normalizeCode,
  confirmedProof,
} from "../lib/team/call-store";
import {
  callNow,
  callableNow,
  phoneNumber,
  smsLink,
  callScript,
  dealText,
} from "../lib/team/call-domain";
import type { TeamLead } from "../lib/team/store";
import { seed } from "../lib/team/seed";
const l: TeamLead = {
  ...seed(true).leads[0],
  phone: "3125550100",
  time_zone: "America/Chicago",
  city: "Chicago",
  fit_score: 50,
};
test("CSPRNG deal codes: 10 characters, case insensitive, unique, no ambiguous characters", () => {
  const codes = Array.from({ length: 10000 }, newDealCode);
  assert.equal(new Set(codes).size, codes.length);
  for (const code of codes) {
    assert.match(code, /^[23456789abcdefghjkmnpqrstuvwxyz]{10}$/);
    assert.equal(normalizeCode(code.toUpperCase()), code);
  }
  for (const bad of [
    "../../secret",
    "1234567890",
    "a".repeat(9),
    "a".repeat(11),
    "l".repeat(10),
  ])
    assert.equal(normalizeCode(bad), null);
});
test("only explicitly confirmed inline raster screenshot proof can publish", () => {
  const p = {
    confidence: "confirmed",
    measurement: "Booking returns 404",
    proof: {
      image: "data:image/png;base64,YQ==",
      captured_at: new Date().toISOString(),
    },
  };
  assert.equal(confirmedProof([p]), p);
  for (const f of [
    { ...p, confidence: "unknown" },
    { ...p, proof: { ...p.proof, image: "https://example.com/private.png" } },
    { ...p, proof: { ...p.proof, image: "data:image/svg+xml;base64,YQ==" } },
    { ...p, proof: { ...p.proof, captured_at: "wrong" } },
  ])
    assert.equal(confirmedProof([f]), null);
});
test("call-now filters local 9–5, unknown zones, opt-outs and restaurant lunch and sorts fit", () => {
  const at = new Date("2026-11-10T17:45:00Z"); // Chicago lunch; New York 12:45; LA 9:45
  const rows = [
    { ...l, id: "lunch", vertical: "restaurant" },
    { ...l, id: "unknown", time_zone: undefined },
    { ...l, id: "invalid", time_zone: "oops" },
    { ...l, id: "closed", time_zone: "Pacific/Honolulu" },
    { ...l, id: "optout", opted_out: true },
    { ...l, id: "declined", call_outcome: "Not interested" },
    { ...l, id: "low", time_zone: "America/Los_Angeles", fit_score: 20 },
    { ...l, id: "best", fit_score: 90 },
    { ...l, id: "lost" },
  ];
  const d = { ...seed(true).deals[0], lead_id: "lost", stage: "Lost" as const };
  assert.deepEqual(
    callNow(rows, [d], at).map((l) => l.id),
    ["best", "low"],
  );
  assert.equal(callableNow(l, new Date("2026-11-10T15:00:00Z")), true);
  assert.equal(callableNow(l, new Date("2026-11-10T23:00:00Z")), false);
  assert.equal(
    callableNow(
      { ...l, vertical: "restaurant" },
      new Date("2026-11-10T19:30:00Z"),
    ),
    true,
  );
  assert.equal(
    callableNow(
      { ...l, time_zone: "America/New_York" },
      new Date("2026-07-01T13:00:00Z"),
    ),
    true,
  );
});
test("phone and SMS links encode body safely with iPhone and Android delimiters", () => {
  assert.equal(phoneNumber("(312) 555-0123"), "+13125550123");
  assert.equal(phoneNumber(""), null);
  const body = "Hi Amy & team: https://example.test/go/abc?x=1";
  assert.equal(
    smsLink("3125550123", body, true),
    "sms:+13125550123&body=" + encodeURIComponent(body),
  );
  assert.equal(
    smsLink("3125550123", body, false),
    "sms:+13125550123?body=" + encodeURIComponent(body),
  );
  assert.equal(smsLink("bad", body), null);
});
test("script uses confirmed problem, name and city; unknown proof makes no sales claim", () => {
  assert.match(callScript(l, "Alex", "Booking link returns 404"), /Chicago/);
  assert.match(
    callScript(l, "Alex", "Booking link returns 404"),
    /Booking link returns 404/,
  );
  assert.doesNotMatch(callScript(l, "Alex", null), /\$299/);
  assert.match(
    dealText(
      l,
      "Broken booking link",
      seed(true).deals[0],
      "https://example.test/go/abcdefghjk",
    ),
    /\$299/,
  );
});
