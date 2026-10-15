import AppHome, { appHomeMetadata } from "@/components/apps/AppHome";
export function generateMetadata() { return appHomeMetadata("trendi"); }
export default function Page() { return <AppHome slug="trendi" />; }
