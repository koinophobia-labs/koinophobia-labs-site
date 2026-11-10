import { notFound, redirect } from "next/navigation";
import { currentSnapshot } from "@/lib/team/session";
import { Portal } from "@/components/team/Portal";
import { cookies } from "next/headers";
import { cookieName, passwordState } from "@/lib/team/auth";
import { hostedPreview, teamDatabase } from "@/lib/team/db";
export default async function Screen({
  params,
}: {
  params: Promise<{ screen: string }>;
}) {
  const { screen } = await params;
  if (
    ![
      "leads",
      "check",
      "quote",
      "pipeline",
      "commissions",
      "scripts",
      "admin",
      "account",
    ].includes(screen)
  )
    notFound();
  const data = await currentSnapshot();
  if (!data) redirect("/team");
  if (screen === "admin" && data.me.role !== "owner") notFound();
  const account = screen === "account" ? hostedPreview()
    ? { hasPassword: false, canReset: false, prompt: false }
    : await passwordState(teamDatabase(), (await cookies()).get(cookieName)!.value)
    : undefined;
  return <Portal screen={screen} initial={JSON.parse(JSON.stringify(data))} account={account} />;
}
