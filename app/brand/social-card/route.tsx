import { ImageResponse } from "next/og";

export const runtime = "edge";

export function GET(request: Request) {
  const logoUrl = new URL("/brand/koinophobia-lockup.svg", request.url).toString();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 32% 42%, rgba(115, 54, 255, 0.34), transparent 45%), #05060a",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt=""
          width="1120"
          height="294"
          style={{ objectFit: "contain" }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    },
  );
}
