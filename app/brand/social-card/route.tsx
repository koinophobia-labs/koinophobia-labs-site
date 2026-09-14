import { ImageResponse } from "next/og";

export const runtime = "edge";

// One social card for every page: the black koi still from the surface loop
// on the right, the emblem lower-left, the page title set in Sora over the
// empty left third. Text is set by this route, never baked into the image.
// Replace /brand/social-plate.jpg with the H9 plate when it exists.

const WIDTH = 1200;
const HEIGHT = 630;
const MAX_TITLE = 90;

async function soraBold(origin: string): Promise<ArrayBuffer | undefined> {
  try {
    const css = await fetch("https://fonts.googleapis.com/css2?family=Sora:wght@700&display=swap", {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:26.0) Gecko/20100101 Firefox/26.0" },
    }).then((r) => r.text());
    const url = css.match(/src: url\(([^)]+\.(?:ttf|woff))\)/)?.[1];
    if (url) return await fetch(url).then((r) => r.arrayBuffer());
  } catch {
    /* fall through to the local fallback */
  }
  try {
    return await fetch(new URL("/fonts/Sora-Bold.ttf", origin)).then((r) => (r.ok ? r.arrayBuffer() : undefined));
  } catch {
    return undefined;
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const raw = (searchParams.get("title") ?? "").trim().slice(0, MAX_TITLE);
  const title = raw || "Nothing here stayed an idea.";
  const kicker = (searchParams.get("kicker") ?? "Koinophobia Labs · a one-person software studio").trim().slice(0, 80);

  const [plate, emblem, font] = await Promise.all([
    fetch(new URL("/brand/social-plate.jpg", origin)).then((r) => r.arrayBuffer()),
    fetch(new URL("/brand/koinophobia-labs-koi-640.webp", origin)).then((r) => r.arrayBuffer()).catch(() => undefined),
    soraBold(origin),
  ]);
  const plateUrl = `data:image/jpeg;base64,${Buffer.from(plate).toString("base64")}`;
  const emblemUrl = emblem ? `data:image/webp;base64,${Buffer.from(emblem).toString("base64")}` : undefined;
  const size = title.length > 60 ? 52 : title.length > 36 ? 62 : 74;

  return new ImageResponse(
    (
      <div
        style={{
          width: WIDTH,
          height: HEIGHT,
          display: "flex",
          position: "relative",
          background: "#04060a",
          fontFamily: font ? "Sora" : "sans-serif",
          color: "#eef4f7",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={plateUrl} width={WIDTH} height={HEIGHT} alt="" style={{ position: "absolute", inset: 0, objectFit: "cover" }} />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(90deg, rgba(4,6,10,0.96) 0%, rgba(4,6,10,0.82) 42%, rgba(4,6,10,0) 70%)",
          }}
        />
        <div style={{ position: "absolute", left: 72, top: 84, right: 420, display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ fontSize: 22, letterSpacing: 4, textTransform: "uppercase", color: "#7fd8ea", fontFamily: "monospace" }}>{kicker}</div>
          <div style={{ fontSize: size, fontWeight: 700, lineHeight: 1.02, letterSpacing: -2 }}>{title}</div>
        </div>
        <div style={{ position: "absolute", left: 72, bottom: 56, display: "flex", alignItems: "center", gap: 18 }}>
          {emblemUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={emblemUrl} width={64} height={64} alt="" />
          ) : null}
          <div style={{ fontSize: 26, fontWeight: 700 }}>Koinophobia Labs</div>
          <div style={{ fontSize: 20, color: "#9db0bd", fontFamily: "monospace" }}>koinophobialabs.com</div>
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: font ? [{ name: "Sora", data: font, weight: 700, style: "normal" }] : undefined,
      headers: {
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    },
  );
}
