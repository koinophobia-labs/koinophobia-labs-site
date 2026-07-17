import { ImageResponse } from "next/og";

export const runtime = "edge";

export function GET(request: Request) {
  const emblemUrl = new URL("/brand/koi-emblem.svg", request.url).toString();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#05060a",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={emblemUrl}
          alt=""
          width="256"
          height="256"
          style={{ objectFit: "cover" }}
        />
      </div>
    ),
    {
      width: 256,
      height: 256,
      headers: {
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    },
  );
}
