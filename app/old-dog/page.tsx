import AppHome, { appHomeMetadata } from "@/components/apps/AppHome";
export function generateMetadata() { return appHomeMetadata("old-dog"); }
export default function Page() { return <AppHome slug="old-dog" />; }
