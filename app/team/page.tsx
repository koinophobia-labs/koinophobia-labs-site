import { partnerHome } from "@/lib/team/affiliate-access";
import { redirect } from "next/navigation";
import { currentPartner } from "@/lib/team/session";
import { hostedPreview } from "@/lib/team/db";
import { mailConfigured } from "@/lib/team/auth";
import { Login } from "@/components/team/Login";
export default async function Team({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  // A reset link must work even if the browser is already signed in.
  const partner = !token ? await currentPartner() : null;
  if (partner) redirect(partnerHome(partner));
  return (
    <Login
      preview={hostedPreview()}
      magic={process.env.VERCEL_ENV === "production" && mailConfigured()}
      token={typeof token === "string" ? token : undefined}
    />
  );
}
