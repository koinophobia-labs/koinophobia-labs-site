import CommercialPage from "./CommercialPage";
import { getSiteProduct } from "@/lib/products";
import { withLiveListing } from "@/lib/app-store";
import { forgetRelease } from "@/lib/releases";
export { metadata } from "./CommercialPage";
export default async function Page() {
  const product = await withLiveListing(getSiteProduct("forget-about-it")!);
  return <CommercialPage version={product.appStore?.version ?? forgetRelease.version} />;
}
