import AppHome, { appHomeMetadata } from "@/components/apps/AppHome";
export function generateMetadata() { return appHomeMetadata("forget-about-it"); }
export default function Page() { return <AppHome slug="forget-about-it" />; }
