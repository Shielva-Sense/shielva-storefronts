export const GARMENTS = ["tee", "shirt", "trousers", "knit", "coat", "dress"] as const;
export type Garment = (typeof GARMENTS)[number];

export const BUILDS = ["slim", "regular", "athletic", "curvy"] as const;
export type Build = (typeof BUILDS)[number];

export const FITS = ["close", "true", "relaxed"] as const;
export type FitPreference = (typeof FITS)[number];

export const SIZES = ["XS", "S", "M", "L", "XL"] as const;
export type Size = (typeof SIZES)[number];

export interface FashionProduct {
    /** = product handle */
    id: string;
    name: string;
    garment: Garment;
    /** CSS color value (token var or admin hex). */
    colour: string;
    colourName: string;
    price: number;
    material: string;
    /** First renderable product photo (Shopify CDN), else the silhouette is drawn. */
    image?: string | undefined;
    variants: readonly { sku: string; option: string | null }[];
}

export interface Hotspot {
    productId: string;
    x: number;
    y: number;
}

export interface Look {
    id: string;
    title: string;
    note: string;
    bgVar: string;
    garments: readonly { productId: string; x: number; y: number; w: number }[];
    hotspots: readonly Hotspot[];
}
