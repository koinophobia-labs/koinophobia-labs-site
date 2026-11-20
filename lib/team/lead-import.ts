import { randomUUID } from "node:crypto";
import type { Lead, Partner, Data } from "./types";
import { SERVICES } from "./config";
import { Fault, textInput } from "./domain";
type RecordValue = Record<string, unknown>;
function object(value: unknown): RecordValue {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Fault("Expected an import object.");
  return value as RecordValue;
}
function date(value: unknown) {
  const s = textInput(value, "Timestamp", true, 80);
  if (!Number.isFinite(Date.parse(s))) throw new Fault("Invalid timestamp.");
  return s;
}
function url(value: unknown) {
  const s = textInput(value, "URL", true, 2000);
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    throw new Fault("Invalid URL.");
  }
  if (!["http:", "https:"].includes(u.protocol) || u.username || u.password)
    throw new Fault("Expected public HTTP(S) URL.");
  return s;
}
export function validateImport(body: unknown, actor: Partner) {
  if (!Array.isArray(body) || body.length < 1 || body.length > 200)
    throw new Fault("Import an array of 1–200 leads.");
  return body.map((value) => {
    const r = object(value);
    const route = object(r.contact_route);
    const offer = object(r.suggested_offer);
    const service = SERVICES.find(
      (s) =>
        s.id === offer.id && ["fix", "tune", "site", "care"].includes(s.id),
    );
    if (
      !service ||
      service.price !== offer.price ||
      service.name !== offer.name ||
      service.cadence !== offer.cadence
    )
      throw new Fault("Offer does not match the current catalog.");
    if (
      ![
        "medspa",
        "fitness",
        "home-services",
        "salon",
        "restaurant",
        "retail",
        "professional-services",
      ].includes(String(r.vertical))
    )
      throw new Fault("Unsupported market/vertical.");
    const city = textInput(r.city, "City", true, 120);
    const state = textInput(r.state, "State", true, 2).toUpperCase();
    if (
      !"AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY"
        .split(" ")
        .includes(state)
    )
      throw new Fault("Expected a US state.");
    const time_zone = textInput(r.time_zone, "Time zone", true, 100);
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: time_zone });
    } catch {
      throw new Fault("Invalid IANA time zone.");
    }
    if (!/^(America|Pacific)\//.test(time_zone))
      throw new Fault("Expected a US IANA time zone.");
    const metro = textInput(r.metro, "Metro", true, 160);
    if (
      !Number.isInteger(r.fit_score) ||
      Number(r.fit_score) < 0 ||
      Number(r.fit_score) > 100
    )
      throw new Fault("Fit score must be 0–100.");
    if (
      !Array.isArray(r.evidence) ||
      !r.evidence.length ||
      r.evidence.length > 30
    )
      throw new Fault("Measured problem evidence is required.");
    const evidence = r.evidence.map((value) => {
      const e = object(value);
      if (
        !Number.isInteger(e.severity) ||
        Number(e.severity) < 1 ||
        Number(e.severity) > 40
      )
        throw new Fault("Invalid severity.");
      return {
        check: textInput(e.check, "Check", true, 100),
        url: url(e.url),
        measured_at: date(e.measured_at),
        measurement: textInput(e.measurement, "Measurement", true, 3000),
        severity: e.severity as number,
        impact: textInput(e.impact, "Impact", true, 1000),
      };
    });
    if (
      !evidence.some((e) =>
        [
          "HTTPS",
          "HTTPS failure",
          "Mobile viewport",
          "Dead contact / booking / order link",
          "Closed Google Form",
          "Slow HTML response",
        ].includes(e.check),
      )
    )
      throw new Fault(
        "A high-value measured problem is required; minor issues alone do not qualify.",
      );
    if (
      !["named-email", "role-email", "phone", "form"].includes(
        String(route.kind),
      )
    )
      throw new Fault("Invalid contact route.");
    const email = textInput(r.email, "Email", false, 254);
    const phone = textInput(r.phone, "Phone", false, 80);
    const routeValue = textInput(route.value, "Contact route", true, 2000);
    if (
      String(route.kind).endsWith("email") &&
      (routeValue !== email ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        !Array.isArray(route.mx) ||
        !route.mx.length ||
        !route.mx.every(
          (x) => typeof x === "string" && x !== "." && /^[a-z0-9.-]+$/i.test(x),
        ))
    )
      throw new Fault(
        "Email requires matching syntax and recorded MX evidence.",
      );
    if (
      route.kind === "phone" &&
      (phone !== routeValue ||
        !/^\+?1?\d{10}$/.test(phone.replace(/[^\d+]/g, "")))
    )
      throw new Fault("Invalid phone contact.");
    if (route.kind === "form") url(routeValue);
    if (r.channel !== "Online")
      throw new Fault("Generated leads must use Online channel.");
    const contactName = textInput(
      route.name,
      "Contact name",
      route.kind === "named-email",
      180,
    );
    const lead: Lead = {
      id: randomUUID(),
      partner_id: actor.id,
      business: textInput(r.business, "Business", true, 180),
      contact: contactName,
      phone,
      email,
      website: url(r.website),
      channel: "Online",
      notes: textInput(r.notes, "Notes", true, 8000),
      created_at: date(r.created_at),
    };
    // Attribution and IDs are assigned locally; untrusted input cannot select another partner.
    return {
      ...lead,
      vertical: String(r.vertical),
      city,
      state,
      time_zone,
      metro,
      evidence,
      contact_route: {
        kind: String(route.kind),
        value: routeValue,
        name: contactName,
        source_url: url(route.source_url),
        measured_at: date(route.measured_at),
        ...(String(route.kind).endsWith("email")
          ? { mx: route.mx as string[] }
          : {}),
      },
      fit_score: Number(r.fit_score),
      score_reason: textInput(r.score_reason, "Score reason", true, 3000),
      suggested_offer: {
        id: service.id,
        name: service.name,
        price: service.price,
        cadence: service.cadence,
      },
      opener: textInput(r.opener, "Opener", true, 4000),
      draft_email: textInput(r.draft_email, "Draft email", true, 6000),
      reply_to: textInput(r.reply_to, "Reply path", true, 254),
      source_url: url(r.source_url),
      discovered_at: date(r.discovered_at),
    };
  });
}
const nameKey = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/\([^)]*\)/g, "")
    .replace(/\b(llc|incorporated|inc|ltd|co|company)\b/g, "")
    .replace(/[^a-z0-9]/g, "");
const host = (s: string) => {
  try {
    return new URL(s).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
};
export function importLeads(db: Data, rows: ReturnType<typeof validateImport>) {
  let imported = 0;
  let duplicates = 0;
  for (const row of rows) {
    if (
      db.leads.some(
        (x) =>
          nameKey(x.business) === nameKey(row.business) ||
          (host(x.website) &&
            (host(x.website) === host(row.website) ||
              host(x.website).endsWith(`.${host(row.website)}`) ||
              host(row.website).endsWith(`.${host(x.website)}`))) ||
          (row.email && x.email.toLowerCase() === row.email.toLowerCase()) ||
          (row.phone &&
            x.phone.replace(/\D/g, "").slice(-10) ===
              row.phone.replace(/\D/g, "").slice(-10)),
      )
    ) {
      duplicates++;
      continue;
    }
    db.leads.push(row);
    imported++;
  }
  return { imported, duplicates };
}
