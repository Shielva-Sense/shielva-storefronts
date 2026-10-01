import type { CatalogItem } from "./types";

/** Live price in dollars for server components (falls back to the built-in price). */
export function priceFrom(items: readonly CatalogItem[], sku: string, fallback: number): number {
    const hit = items.find((i) => i.sku === sku);
    return hit ? hit.priceCents / 100 : fallback;
}
