import { cssColor, isRenderableMedia } from "@/features/storefront/constants";
import type { StoreProduct } from "@/features/storefront/types";
import { FASHION_PRODUCTS } from "./constants";
import { GARMENTS, type FashionProduct, type Garment } from "./types";

export interface FashionCatalog {
    items: FashionProduct[];
    hero: FashionProduct;
    find: (handle: string) => FashionProduct | undefined;
}

const isGarment = (v: string | undefined): v is Garment => (GARMENTS as readonly string[]).includes(v ?? "");

/**
 * Live products → ATELIER NORD's designed sections. `permanent`-tagged products form the
 * collection (grid, fit finder, lookbook hotspots); `hero` picks the drawn hero garment.
 */
export function fashionCatalog(products: readonly StoreProduct[]): FashionCatalog {
    const live: FashionProduct[] = products
        .filter((p) => p.tags.includes("permanent"))
        .map((p) => ({
            id: p.handle,
            name: p.title,
            garment: isGarment(p.attributes.garment) ? p.attributes.garment : "tee",
            colour: cssColor(p.attributes.color, "var(--color-stone)"),
            colourName: p.attributes.colorName ?? "",
            material: p.attributes.material ?? "",
            price: (p.variants[0]?.priceCents ?? 0) / 100,
            image: p.media.find((m) => isRenderableMedia(m)),
            variants: p.variants.map((v) => ({ sku: v.sku, option: v.option })),
        }));
    const items = live.length > 0 ? live : [...FASHION_PRODUCTS];
    const heroHandle = products.find((p) => p.tags.includes("hero"))?.handle;
    const hero = items.find((i) => i.id === heroHandle) ?? items.find((i) => i.garment === "coat") ?? (items[0] as FashionProduct);
    return { items, hero, find: (handle) => items.find((i) => i.id === handle) ?? FASHION_PRODUCTS.find((i) => i.id === handle) };
}

/** SKU for a size: the variant whose option matches, else the conventional handle:size. */
export function skuForSize(product: FashionProduct, size: string): string {
    return product.variants.find((v) => v.option === size)?.sku ?? `${product.id}:${size}`;
}
