import { isTrustedMutationRequest } from "@/lib/security/origin";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { hostedPreview, teamDatabase, transaction } from "@/lib/team/db";
import {
  cookieName,
  cookieOptions,
  rateLimit,
  emailInput,
  passwordLogin,
  requestMagicLink,
  consumeMagicLink,
  mailConfigured,
  invite,
  digest,
} from "@/lib/team/auth";
import { currentPartner } from "@/lib/team/session";
import { Fault, owner, textInput } from "@/lib/team/domain";
import {
  importAssigned,
  optOut,
  saveQuote,
  updateDeal,
  recordPayout,
} from "@/lib/team/store";
import { checkSite } from "@/lib/team/checker";
import { randomUUID } from "node:crypto";
export const runtime = "nodejs";
export const maxDuration = 60;
async function bodyOf(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Fault("Request body required.");
  let total = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > 2_000_000) {
      await reader.cancel();
      throw new Fault("Upload must be under 2 MB.", 413);
    }
    chunks.push(value);
  }
  try {
    const b = JSON.parse(Buffer.concat(chunks).toString());
    if (!b || Array.isArray(b) || typeof b !== "object") throw Error();
    return b as Record<string, unknown>;
  } catch {
    throw new Fault("Expected a JSON object.");
  }
}
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ action: string }> },
) {
  try {
    if (!isTrustedMutationRequest(request))
      throw new Fault("Request origin rejected.", 403);
    const { action } = await params,
      body = await bodyOf(request),
      jar = await cookies();
    const ok = (value: unknown) =>
      NextResponse.json(value, {
        headers: {
          "Cache-Control": "no-store",
          "X-Robots-Tag": "noindex, nofollow",
        },
      });
    if (action === "logout") {
      if (!hostedPreview() && jar.get(cookieName))
        await teamDatabase().query(
          "delete from team_sessions where token_hash=$1",
          [digest(jar.get(cookieName)!.value)],
        );
      jar.set(cookieName, "", { ...cookieOptions, maxAge: 0 });
      return ok({ ok: true });
    }
    if (hostedPreview()) {
      if (
        action === "demo" &&
        ["owner", "partner"].includes(String(body.role))
      ) {
        jar.set(cookieName, `preview-${body.role}`, cookieOptions);
        return ok({ ok: true });
      }
      throw new Fault(
        "This hosted preview is read-only and contains fake data. Functional flows are verified against the isolated local database.",
        409,
      );
    }
    if (["login", "magic", "consume"].includes(action)) {
      const db = teamDatabase();
      const ip = process.env.VERCEL
        ? request.headers.get("x-vercel-forwarded-for") || "unknown"
        : "local";
      await rateLimit(db, "login-ip:" + ip, 30);
      if (action === "consume") {
        const value = textInput(body.token, "Token", true, 100);
        await rateLimit(db, "token:" + digest(value));
        const session = await transaction((q) => consumeMagicLink(q, value));
        jar.set(cookieName, session, cookieOptions);
        return ok({ ok: true });
      }
      const email = emailInput(body.email);
      await rateLimit(db, "login-email:" + email);
      if (action === "magic") {
        if (!mailConfigured() || process.env.VERCEL_ENV !== "production")
          throw new Fault(
            "Email login is unavailable here. Use your invite and password.",
            409,
          );
        await requestMagicLink(db, email, "https://koinophobialabs.com");
        return ok({
          message:
            "If your email has an active invitation, a login link is on its way.",
        });
      }
      if (mailConfigured() && process.env.VERCEL_ENV === "production")
        throw new Fault("Use email-link login for this team.", 409);
      const session = await transaction((q) =>
        passwordLogin(
          q,
          email,
          textInput(body.password, "Password", true, 256),
          textInput(body.code, "Invite code", false, 100),
        ),
      );
      jar.set(cookieName, session, cookieOptions);
      return ok({ ok: true });
    }
    const p = await currentPartner();
    if (!p) throw new Fault("Please sign in.", 401);
    await rateLimit(teamDatabase(), "action:" + p.id, 100);
    if (action === "check") {
      await rateLimit(teamDatabase(), "site-check:" + p.id, 10);
      const result = await checkSite(
        textInput(body.url, "Website", true, 2000),
      );
      await teamDatabase().query(
        "insert into team_site_checks(id,partner_id,data) values($1,$2,$3)",
        [randomUUID(), p.id, result],
      );
      return ok({ ok: true });
    }
    const result = await transaction(async (q) => {
      switch (action) {
        case "invite":
          return invite(q, p, body);
        case "import":
          return importAssigned(
            q,
            p,
            textInput(body.partner_id, "Partner", true, 80),
            body.leads,
          );
        case "optout":
          return optOut(q, p, textInput(body.id, "Lead", true, 80));
        case "quote":
          return saveQuote(q, p, body);
        case "deal":
          return updateDeal(q, p, textInput(body.id, "Deal", true, 80), body);
        case "payout":
          return recordPayout(
            q,
            p,
            textInput(body.id, "Deal", true, 80),
            body.amount,
          );
        case "settings":
          owner(p);
          await q.query(
            "insert into team_settings(key,value) values('mailing_address',$1) on conflict(key) do update set value=excluded.value",
            [textInput(body.address, "Mailing address", false, 500)],
          );
          return { ok: true };
        case "deactivate":
          owner(p);
          if (body.id === p.id)
            throw new Fault("You cannot deactivate your own owner account.");
          await q.query(
            "update team_partners set active=false where id=$1 and role='partner'",
            [textInput(body.id, "Partner", true, 80)],
          );
          return { ok: true };
        default:
          throw new Fault("Not found.", 404);
      }
    });
    return ok(result);
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Fault
            ? e.message
            : "Request could not be completed. Please try again or contact Blake.",
      },
      {
        status: e instanceof Fault ? e.status : 500,
        headers: {
          "Cache-Control": "no-store",
          "X-Robots-Tag": "noindex, nofollow",
        },
      },
    );
  }
}
