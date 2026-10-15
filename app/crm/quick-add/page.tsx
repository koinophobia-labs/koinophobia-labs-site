import Link from "next/link";
import { requireCrmPageAccess } from "@/lib/crm-access";
import QuickAdd from "./QuickAdd";
export const dynamic = "force-dynamic";
export default async function QuickAddPage() {
 await requireCrmPageAccess();
 return <main className="section simple-page crm-page"><Link href="/crm">← Lead CRM</Link><h1>Quick add</h1><p>Capture a conversation and the next step. Private to the studio.</p><QuickAdd /></main>;
}
