import AppHome, { appHomeMetadata } from "@/components/apps/AppHome";
export function generateMetadata() { return appHomeMetadata("preaching-to-the-choir"); }
export default function Page() { return <AppHome slug="preaching-to-the-choir" />; }
