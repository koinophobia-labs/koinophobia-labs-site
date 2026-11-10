import test from "node:test";
import assert from "node:assert/strict";
import { validateImport, importLeads } from "../lib/team/lead-import";
import { seed } from "../lib/team/seed";
const fixture = () => ({
  id: "ignored-input-id",
  partner_id: "foreign-owner",
  business: "FICTIONAL Import Salon",
  contact: "",
  phone: "3125550123",
  email: "",
  website: "https://fictional.example/",
  channel: "Online",
  notes: "Draft only",
  created_at: "2026-11-10T12:00:00Z",
  vertical: "salon",
  city: "Austin",
  state: "TX",
  time_zone: "America/Chicago",
  metro: "austin,TX",
  draft_email: "Fictional draft",
  reply_to: "blake@koinophobialabs.com",
  evidence: [
    {
      check: "Mobile viewport",
      url: "https://fictional.example/",
      measured_at: "2026-11-10T12:00:00Z",
      measurement: "No device-width viewport found in returned HTML.",
      severity: 25,
      impact:
        "The missing viewport may make the page harder to use on a phone.",
    },
  ],
  contact_route: {
    kind: "phone",
    value: "3125550123",
    name: "",
    source_url: "https://fictional.example/",
    measured_at: "2026-11-10T12:00:00Z",
  },
  fit_score: 32,
  score_reason: "Severity 25; contact 5; size 2.",
  suggested_offer: {
    id: "fix",
    name: "The Fix",
    price: 29900,
    cadence: "once",
  },
  opener:
    "We work remotely with businesses across the US. I checked the page and found no mobile viewport.",
  source_url: "https://www.openstreetmap.org/node/1",
  discovered_at: "2026-11-10T12:00:00Z",
});
test("import retains measured evidence and assigns authenticated attribution", () => {
  const db = seed(false);
  const [lead] = validateImport([fixture()], db.partners[0]);
  assert.equal(lead.partner_id, db.partners[0].id);
  assert.notEqual(lead.id, fixture().id);
  assert.deepEqual(lead.evidence, fixture().evidence);
  assert.equal(importLeads(db, [lead]).imported, 1);
  assert.equal(importLeads(db, [lead]).duplicates, 1);
});
test("import rejects absent evidence, invented price, invalid route and score", () => {
  const p = seed(false).partners[0];
  for (const changed of [
    { evidence: [] },
    { fit_score: 101 },
    { suggested_offer: { ...fixture().suggested_offer, price: 1 } },
    { contact_route: { ...fixture().contact_route, kind: "carrier-pigeon" } },
    { channel: "Email" },
  ])
    assert.throws(() => validateImport([{ ...fixture(), ...changed }], p));
});
test("email import requires MX record and matching contact", () => {
  const p = seed(false).partners[0];
  const f = {
    ...fixture(),
    phone: "",
    email: "info@fictional.example",
    contact_route: {
      ...fixture().contact_route,
      kind: "role-email",
      value: "info@fictional.example",
      mx: ["mx.fictional.example"],
    },
  };
  assert.doesNotThrow(() => validateImport([f], p));
  assert.throws(() =>
    validateImport(
      [{ ...f, contact_route: { ...f.contact_route, mx: ["."] } }],
      p,
    ),
  );
});
test("duplicates normalize name and website aliases and dedupe within a batch", () => {
  const db = seed(false);
  const rows = validateImport(
    [
      fixture(),
      {
        ...fixture(),
        business: "FICTIONAL Import Salon, LLC",
        website: "https://www.fictional.example/contact",
      },
    ],
    db.partners[0],
  );
  assert.deepEqual(importLeads(db, rows), { imported: 1, duplicates: 1 });
});
test("nationwide import preserves city, state, time zone, draft and reply path", () => {
  const f = fixture();
  const [l] = validateImport([f], seed(false).partners[0]);
  for (const key of [
    "city",
    "state",
    "time_zone",
    "metro",
    "draft_email",
    "reply_to",
  ] as const)
    assert.equal(l[key], f[key]);
});
test("import rejects minor-only problems, invalid state, missing city and invalid time zone", () => {
  for (const change of [
    { evidence: [{ ...fixture().evidence[0], check: "Meta description" }] },
    { state: "ZZ" },
    { city: "" },
    { time_zone: "Invalid/Zone" },
  ])
    assert.throws(() =>
      validateImport([{ ...fixture(), ...change }], seed(false).partners[0]),
    );
});
