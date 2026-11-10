import { NextRequest, NextResponse } from "next/server";
import { processStripeEvent, stripe } from "@/lib/payments";
export const maxDuration = 60;
export async function POST(r: NextRequest) {
  if (process.env.VERCEL_ENV === "preview")
    return NextResponse.json({ ok: false }, { status: 409 });
  const signature = r.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ ok: false }, { status: 400 });
  const body = await r.text();
  let event;
  for (const secret of [
    process.env.STRIPE_WEBHOOK_SECRET,
    process.env.STRIPE_CONNECT_WEBHOOK_SECRET,
  ]) {
    if (!secret) continue;
    try {
      event = stripe().webhooks.constructEvent(body, signature, secret);
      break;
    } catch {}
  }
  if (!event) return NextResponse.json({ ok: false }, { status: 400 });
  try {
    return NextResponse.json({
      ok: true,
      ...(await processStripeEvent(event)),
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
