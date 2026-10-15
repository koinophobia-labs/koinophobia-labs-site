import AppHome, { appHomeMetadata } from "@/components/apps/AppHome";
export function generateMetadata() { return appHomeMetadata("way-in"); }
export default function Page() { return <AppHome slug="way-in" />; }
