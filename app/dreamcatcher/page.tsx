import AppHome, { appHomeMetadata } from "@/components/apps/AppHome";
export function generateMetadata() { return appHomeMetadata("dreamcatcher"); }
export default function Page() { return <AppHome slug="dreamcatcher" />; }
