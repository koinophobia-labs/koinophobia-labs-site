import type { NextRequest } from "next/server";

function normalizedOrigin(value: string | null | undefined) {
  if (!value) return "";
  try { return new URL(value).origin; } catch { return ""; }
}

export function isTrustedMutationRequest(request: NextRequest) {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") return false;
  if (fetchSite === "same-origin") return true;

  const rawOrigin = request.headers.get("origin");
  const origin = normalizedOrigin(rawOrigin);
  if (!origin) return !rawOrigin;

  const allowed = new Set<string>([request.nextUrl.origin]);
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProto || request.nextUrl.protocol.replace(":", "");
  if (host && (protocol === "http" || protocol === "https")) allowed.add(`${protocol}://${host}`);

  const configuredSite = normalizedOrigin(process.env.NEXT_PUBLIC_SITE_URL);
  if (configuredSite) allowed.add(configuredSite);
  return allowed.has(origin);
}
