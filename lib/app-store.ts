import type { SiteProduct } from "@/lib/products";

// Build-time read of the public App Store listing, so the site can never
// drift from the store again. The registry's literal version remains the
// verified claim (a human looked); this only refreshes the number shown next
// to a badge. Any failure falls back to the registry, silently.

const LOOKUP = "https://itunes.apple.com/lookup";
const TIMEOUT_MS = 5000;
const REVALIDATE_SECONDS = 86_400;

export type Listing = {
  id: string;
  version: string;
  price: string;
  releasedAt?: string;
  minimumOs?: string;
};

type LookupResult = {
  trackId: number;
  version: string;
  formattedPrice?: string;
  currentVersionReleaseDate?: string;
  minimumOsVersion?: string;
};

export function appStoreId(url: string): string | undefined {
  return url.match(/\/id(\d+)/)?.[1];
}

let inflight: Promise<Map<string, Listing>> | undefined;

async function lookup(ids: string[]): Promise<Map<string, Listing>> {
  const map = new Map<string, Listing>();
  if (!ids.length) return map;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${LOOKUP}?id=${ids.join(",")}&country=us`, {
      signal: controller.signal,
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!response.ok) return map;
    const data = (await response.json()) as { results?: LookupResult[] };
    for (const result of data.results ?? []) {
      map.set(String(result.trackId), {
        id: String(result.trackId),
        version: result.version,
        price: result.formattedPrice ?? "",
        releasedAt: result.currentVersionReleaseDate,
        minimumOs: result.minimumOsVersion,
      });
    }
  } catch {
    // Offline build, blocked network, or Apple down: the registry stands.
  } finally {
    clearTimeout(timer);
  }
  return map;
}

/** Fetch every shipped product's listing once per build. */
export function liveListings(products: SiteProduct[]): Promise<Map<string, Listing>> {
  if (!inflight) {
    const ids = products.map((p) => p.appStore && appStoreId(p.appStore.url)).filter((id): id is string => Boolean(id));
    inflight = lookup(ids);
  }
  return inflight;
}

/** The same products, with the store's current version where it answered. */
export async function withLiveListings<T extends SiteProduct>(products: T[]): Promise<T[]> {
  const listings = await liveListings(products);
  return products.map((product) => {
    if (!product.appStore) return product;
    const id = appStoreId(product.appStore.url);
    const live = id ? listings.get(id) : undefined;
    if (!live?.version || live.version === product.appStore.version) return product;
    return { ...product, appStore: { ...product.appStore, version: live.version } };
  });
}

export async function withLiveListing<T extends SiteProduct>(product: T): Promise<T> {
  const [patched] = await withLiveListings([product]);
  return patched;
}
