export const SKIN_TONES = ["fair", "light", "medium", "tan", "deep", "rich"] as const;
export type SkinTone = (typeof SKIN_TONES)[number];

export const UNDERTONES = ["warm", "neutral", "cool"] as const;
export type Undertone = (typeof UNDERTONES)[number];

export interface LipShade {
    /** = SKU (also the DOM anchor of the shade card). */
    id: string;
    sku: string;
    /** Product title ("Velvet Lip") — the shade name is `name`. */
    productName: string;
    /** Product handle (live catalogue only) — addresses the product for inline editing. */
    handle?: string | undefined;
    name: string;
    finish: string;
    /** CSS color value (token var or admin hex). */
    swatch: string;
    price: number;
    undertone: Undertone;
    bestFor: readonly SkinTone[];
    /** Product photo (Shopify CDN); the drawn swatch art is used when absent. */
    image?: string | undefined;
}

export interface BundleItem {
    /** = SKU */
    id: string;
    /** Product handle (live catalogue only). */
    handle?: string | undefined;
    name: string;
    price: number;
    /** CSS color value. */
    tint: string;
    /** Product photo (Shopify CDN); the tint dot is used when absent. */
    image?: string | undefined;
}

export interface BeautyCatalog {
    shades: LipShade[];
    hero: LipShade;
    bundle: { pick: number; price: number; items: BundleItem[] };
}
