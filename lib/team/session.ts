import { cookies } from "next/headers";
import { cookieName, sessionActor } from "./auth";
import { hostedPreview, teamDatabase } from "./db";
import { seed } from "./seed";
import { scoped } from "./domain";
import { snapshot, type TeamSnapshot } from "./store";
export async function currentPartner() {
  const value = (await cookies()).get(cookieName)?.value;
  if (hostedPreview())
    return value === "preview-owner"
      ? seed(true).partners[0]
      : value === "preview-partner"
        ? seed(true).partners[1]
        : null;
  if (!value) return null;
  return sessionActor(teamDatabase(), value);
}
export async function currentSnapshot(): Promise<TeamSnapshot | null> {
  const me = await currentPartner();
  if (!me) return null;
  if (hostedPreview()) {
    const data = seed(true);
    data.site_checks.push({
      id: "fake-check",
      partner_id: "demo-a",
      url: "https://example.test",
      final_url: "https://example.test",
      measured_at: "2026-11-10T12:00:00Z",
      duration_ms: 182,
      findings: [
        {
          name: "HTTPS",
          status: "pass",
          detail: "Fictional example: HTTPS certificate verified.",
        },
        {
          name: "Mobile viewport",
          status: "review",
          detail: "Fictional example: no device-width viewport found.",
        },
        {
          name: "Contact / booking link",
          status: "review",
          detail: "Fictional example: booking link returned HTTP 404.",
        },
      ],
    });
    return {
      ...scoped(data, me),
      me,
      fake: true,
      readonly: true,
      mailingAddress: "",
      leads: scoped(data, me).leads,
    };
  }
  return snapshot(teamDatabase(), me);
}
