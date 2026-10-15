import AppHome, { appHomeMetadata } from "@/components/apps/AppHome";
export function generateMetadata() { return appHomeMetadata("teachers-pet"); }
export default function Page() { return <AppHome slug="teachers-pet" />; }
