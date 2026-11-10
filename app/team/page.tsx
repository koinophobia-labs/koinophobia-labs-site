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
  if (await currentPartner()) redirect("/team/leads");
  const { token } = await searchParams;
  return (
    <Login
      preview={hostedPreview()}
      magic={process.env.VERCEL_ENV === "production" && mailConfigured()}
      token={typeof token === "string" ? token : undefined}
    />
  );
}
