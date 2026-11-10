import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt as kdf,
  timingSafeEqual,
} from "node:crypto";
import type { Queryable } from "../payments";
import { Fault, owner, textInput } from "./domain";
import type { Partner } from "./types";
const scrypt = (value: string, salt: string) =>
  new Promise<Buffer>((resolve, reject) =>
    kdf(
      value,
      salt,
      64,
      { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 },
      (error, key) => (error ? reject(error) : resolve(key)),
    ),
  );
export const digest = (s: string) =>
  createHash("sha256").update(s).digest("hex");
const token = () => randomBytes(32).toString("base64url");
export const cookieName = "team-session";
export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/team",
  maxAge: 43200,
};
export function emailInput(value: unknown) {
  const e = textInput(value, "Email", true, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
    throw new Fault("Enter a valid email.");
  return e;
}
export async function hashPassword(value: string) {
  if (value.length < 12 || value.length > 256)
    throw new Fault("Use a password with 12–256 characters.");
  const salt = randomBytes(16).toString("hex");
  const key = await scrypt(value, salt);
  return `scrypt:${salt}:${key.toString("hex")}`;
}
export async function verifyPassword(value: string, stored: string) {
  const [kind, salt, hex] = stored.split(":");
  if (kind !== "scrypt" || !salt || !hex || value.length > 256) return false;
  const key = await scrypt(value, salt);
  const expected = Buffer.from(hex, "hex");
  return expected.length === key.length && timingSafeEqual(key, expected);
}
export function actor(
  row: Record<string, unknown>,
): Partner & { email: string } {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    role: row.role as Partner["role"],
    active: row.active === true,
    parent_partner_id: row.parent_partner_id as string | null,
    commission_rate: 0.4,
    override_rate: Number(row.override_rate),
  };
}
export async function rateLimit(q: Queryable, key: string, limit = 8) {
  const r = await q.query(
    `insert into team_rate_limits(key,attempts,reset_at) values($1,1,now()+interval '15 minutes')
 on conflict(key) do update set attempts=case when team_rate_limits.reset_at<=now() then 1 else team_rate_limits.attempts+1 end,
 reset_at=case when team_rate_limits.reset_at<=now() then now()+interval '15 minutes' else team_rate_limits.reset_at end returning attempts`,
    [digest(key)],
  );
  if (r.rows[0].attempts > limit)
    throw new Fault("Too many attempts. Try again in 15 minutes.", 429);
}
export async function invite(
  q: Queryable,
  p: Partner,
  input: Record<string, unknown>,
) {
  owner(p);
  const code = token(),
    id = randomUUID();
  const parent =
    textInput(input.parent_partner_id, "Parent", false, 80) || null;
  if (
    parent &&
    !(
      await q.query(
        "select id from team_partners where id=$1 and role='partner' and active",
        [parent],
      )
    ).rows[0]
  )
    throw new Fault("Parent partner not found.");
  await q.query(
    `insert into team_partners(id,name,email,role,parent_partner_id,invite_hash,invite_expires_at) values($1,$2,$3,'partner',$4,$5,now()+interval '7 days')`,
    [
      id,
      textInput(input.name, "Name", true, 120),
      emailInput(input.email),
      parent,
      digest(code),
    ],
  );
  return { id, code };
}
export async function newSession(q: Queryable, id: string) {
  const value = token();
  await q.query(
    "insert into team_sessions(token_hash,partner_id,expires_at) values($1,$2,now()+interval '12 hours')",
    [digest(value), id],
  );
  return value;
}
export async function passwordLogin(
  q: Queryable,
  email: string,
  password: string,
  code = "",
) {
  const row = (
    await q.query("select * from team_partners where email=$1 and active", [
      email,
    ])
  ).rows[0];
  if (code) {
    if (
      !row?.invite_hash ||
      row.invite_hash !== digest(code) ||
      new Date(row.invite_expires_at).getTime() <= Date.now()
    )
      throw new Fault("Email or invite is invalid or expired.", 401);
    const hash = await hashPassword(password);
    const claimed = await q.query(
      "update team_partners set password_hash=$1,invite_hash=null,invite_expires_at=null where id=$2 and invite_hash=$3 and invite_expires_at>now() returning id",
      [hash, row.id, digest(code)],
    );
    if (!claimed.rows[0]) throw new Fault("Invite already used.", 401);
  } else {
    // Do the same KDF work for unknown accounts to avoid an easy timing oracle.
    const dummy = "scrypt:00000000000000000000000000000000:" + "0".repeat(128);
    if (
      !(await verifyPassword(password, row?.password_hash || dummy)) ||
      !row?.password_hash
    )
      throw new Fault("Email or password is incorrect.", 401);
  }
  return newSession(q, row.id);
}
export async function sessionActor(q: Queryable, value: string | undefined) {
  if (!value) return null;
  const row = (
    await q.query(
      "select p.* from team_sessions s join team_partners p on p.id=s.partner_id where s.token_hash=$1 and s.expires_at>now() and p.active",
      [digest(value)],
    )
  ).rows[0];
  return row ? actor(row) : null;
}
export const mailConfigured = () =>
  Boolean(process.env.RESEND_API_KEY && process.env.CONTACT_FROM_EMAIL);
export async function requestMagicLink(
  q: Queryable,
  email: string,
  origin: string,
  send = sendMagicLink,
) {
  const row = (
    await q.query("select id from team_partners where email=$1 and active", [
      email,
    ])
  ).rows[0];
  if (!row) return;
  const value = token();
  await q.query(
    "insert into team_login_tokens(token_hash,partner_id,expires_at) values($1,$2,now()+interval '15 minutes')",
    [digest(value), row.id],
  );
  try {
    await send(email, `${origin}/team?token=${encodeURIComponent(value)}`);
  } catch {
    await q.query("delete from team_login_tokens where token_hash=$1", [
      digest(value),
    ]);
    throw new Fault("Login email unavailable. Try again later.", 503);
  }
}
async function sendMagicLink(email: string, url: string) {
  if (process.env.VERCEL_ENV !== "production" || !mailConfigured())
    throw Error("Email is disabled outside production.");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM_EMAIL,
      to: email,
      subject: "Your Koinophobia Labs team login",
      text: `Sign in to your invited team account. This link expires in 15 minutes.\n\n${url}\n\nIgnore this email if you did not request it.`,
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw Error("Email provider rejected login request.");
}
export async function consumeMagicLink(q: Queryable, value: string) {
  const r = await q.query(
    `delete from team_login_tokens t using team_partners p where t.token_hash=$1 and t.expires_at>now() and p.id=t.partner_id and p.active returning t.partner_id`,
    [digest(value)],
  );
  if (!r.rows[0]) throw new Fault("Login link is invalid or expired.", 401);
  return newSession(q, r.rows[0].partner_id);
}
