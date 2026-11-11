"use client";
import { Analytics } from "@vercel/analytics/next";
export default function PrivateAwareAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => {
        const path = new URL(event.url).pathname;
        return path === "/team" || path.startsWith("/team/") || path.startsWith("/go/") || path.startsWith("/pay/") || path.startsWith("/start/") || path.startsWith("/payment/") ? null : event;
      }}
    />
  );
}
