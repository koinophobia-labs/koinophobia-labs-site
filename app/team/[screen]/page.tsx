import { notFound, redirect } from "next/navigation";
import { currentSnapshot } from "@/lib/team/session";
import { Portal } from "@/components/team/Portal";
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
    ].includes(screen)
  )
    notFound();
  const data = await currentSnapshot();
  if (!data) redirect("/team");
  if (screen === "admin" && data.me.role !== "owner") notFound();
  return <Portal screen={screen} initial={JSON.parse(JSON.stringify(data))} />;
}
