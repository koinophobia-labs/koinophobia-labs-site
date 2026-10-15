import { NextResponse, type NextRequest } from "next/server";
import { showPrereleaseAppPages } from "@/lib/app-homes";

// The release gate also covers original and optimized promotional assets.
export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname === "/_next/image"
    ? request.nextUrl.searchParams.get("url") ?? ""
    : request.nextUrl.pathname;
  if (/^\/apps\/(teachers-pet|dreamcatcher)(\/|$)/.test(path) && !showPrereleaseAppPages()) {
    return new NextResponse(null, { status: 404, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
  }
  return NextResponse.next();
}
export const config = { matcher: ["/apps/teachers-pet/:path*", "/apps/dreamcatcher/:path*", "/_next/image"] };
