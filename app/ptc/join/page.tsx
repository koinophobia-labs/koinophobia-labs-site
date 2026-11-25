import type { Metadata, Viewport } from "next";
import InviteJoin from "./InviteJoin";
import { PTC_APP_STORE_ID, PTC_INVITE_OG_IMAGE, PTC_INVITE_URL } from "@/lib/ptc-invite";

const title = "Join my prayer group";
const description = "You're invited to pray together on Preaching to the Choir.";

// Static metadata so link-preview fetchers (iMessage, WhatsApp, Slack) get
// every tag in <head>. The invite secret is in the URL fragment, which never
// reaches the server, so nothing here can or does depend on it.
export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: PTC_INVITE_URL },
  robots: { index: false, follow: false },
  itunes: { appId: PTC_APP_STORE_ID },
  openGraph: {
    type: "website",
    siteName: "Preaching to the Choir",
    url: PTC_INVITE_URL,
    title,
    description,
    images: [{ url: PTC_INVITE_OG_IMAGE, width: 1200, height: 630, type: "image/jpeg", alt: "Join my prayer group on Preaching to the Choir" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [PTC_INVITE_OG_IMAGE],
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#F4F0E7",
};

const body = "instrument_sans_b2632be1-module__skqw7a__variable";
const display = "eb_garamond_3c57a91a-module__2ldV5W__variable";

export default function PtcJoinPage() {
  return <div className={`ptc-join ${body} ${display}`}>
    <main className="ptc-join__card">
      <p className="ptc-join__eyebrow">Preaching to the Choir</p>
      <InviteJoin />
    </main>
  </div>;
}
