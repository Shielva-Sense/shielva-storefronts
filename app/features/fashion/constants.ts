import { SIZES, type Build, type FashionProduct, type FitPreference, type Garment, type Look, type Size } from "./types";

export const FASHION_BRAND = "ATELIER NORD";

/** Built-in copy used when the page builder has no value (and when the API is unreachable). */
export const FASHION_SECTION_DEFAULTS = {
    hero: { rowA: "Wear less.", rowB: "Better.", tagline: "Autumn / 26 — fourteen pieces, made to last a decade." },
    lookbook: { title: "Lookbook", note: "Tap + to shop a piece straight from the look." },
    fit: { eyebrow: "Fit finder", title: "Your size. First time.", lede: "Three questions, one answer — trained on how thousands of customers actually kept their size." },
    trueCost: { title: "Every dollar, accounted for." },
    shop: { title: "The permanent collection", note: "Free exchanges · Repairs for life" },
    drop: { eyebrow: "Next drop · Friday 10:00 AM", title: "The Knit Edit", lede: "Six pieces, one run. Waitlist members get a 24-hour head start." },
} as const;

export const FASHION_FALLBACK_SECTIONS = ["fashion.hero", "marquee", "fashion.lookbook", "fashion.fit", "fashion.trueCost", "fashion.shop", "fashion.drop"] as const;
export const FASHION_FREE_SHIPPING_AT = 150;

export const FASHION_NAV = [
    { href: "#lookbook", label: "Lookbook" },
    { href: "#fit", label: "Fit finder" },
    { href: "#pricing", label: "True cost" },
    { href: "#shop", label: "Shop" },
] as const;

/** Silhouettes as clip-paths — lightweight "photography" for the demo; swap for product shots via the CMS. */
export const GARMENT_SHAPE: Record<Garment, string> = {
    tee: "polygon(32% 0, 68% 0, 100% 14%, 88% 34%, 80% 28%, 80% 100%, 20% 100%, 20% 28%, 12% 34%, 0 14%)",
    shirt: "polygon(34% 0, 50% 10%, 66% 0, 100% 12%, 92% 62%, 82% 58%, 82% 100%, 18% 100%, 18% 58%, 8% 62%, 0 12%)",
    trousers: "polygon(16% 0, 84% 0, 90% 100%, 58% 100%, 50% 26%, 42% 100%, 10% 100%)",
    knit: "polygon(30% 0, 70% 0, 100% 16%, 96% 80%, 84% 82%, 82% 100%, 18% 100%, 16% 82%, 4% 80%, 0 16%)",
    coat: "polygon(32% 0, 50% 20%, 68% 0, 100% 10%, 97% 96%, 84% 96%, 84% 100%, 16% 100%, 16% 96%, 3% 96%, 0 10%)",
    dress: "polygon(36% 0, 64% 0, 68% 30%, 96% 100%, 4% 100%, 32% 30%)",
};

export const GARMENT_RATIO: Record<Garment, number> = { tee: 1, shirt: 1.15, trousers: 1.7, knit: 1.05, coat: 1.5, dress: 1.6 };

const SIZE_VARIANTS = (handle: string) => SIZES.map((size) => ({ sku: `${handle}:${size}`, option: size }));

/** Built-in collection — used when the live catalogue is unavailable. */
export const FASHION_PRODUCTS: readonly FashionProduct[] = [
    { id: "wool-overcoat", name: "The Wool Overcoat", garment: "coat", colour: "var(--color-camel)", colourName: "Camel", price: 395, material: "Recycled Italian wool", variants: SIZE_VARIANTS("wool-overcoat") },
    { id: "oxford-shirt", name: "Organic Oxford Shirt", garment: "shirt", colour: "var(--color-linen)", colourName: "Oat", price: 98, material: "GOTS organic cotton", variants: SIZE_VARIANTS("oxford-shirt") },
    { id: "wide-trouser", name: "Wide Pleat Trouser", garment: "trousers", colour: "var(--color-olive)", colourName: "Olive", price: 145, material: "Tencel twill", variants: SIZE_VARIANTS("wide-trouser") },
    { id: "merino-knit", name: "Merino Crew Knit", garment: "knit", colour: "var(--color-rust)", colourName: "Rust", price: 165, material: "Extra-fine merino", variants: SIZE_VARIANTS("merino-knit") },
    { id: "heavy-tee", name: "Heavyweight Tee", garment: "tee", colour: "var(--color-coal)", colourName: "Coal", price: 48, material: "240gsm organic cotton", variants: SIZE_VARIANTS("heavy-tee") },
    { id: "slip-dress", name: "Linen Slip Dress", garment: "dress", colour: "var(--color-denim)", colourName: "Ink", price: 178, material: "European flax linen", variants: SIZE_VARIANTS("slip-dress") },
];


export const LOOKS: readonly Look[] = [
    {
        id: "commute",
        title: "Look 01 — The commute",
        note: "Overcoat over a heavyweight tee. Built for grey November commutes.",
        bgVar: "--color-linen",
        garments: [{ productId: "wool-overcoat", x: 30, y: 12, w: 40 }, { productId: "heavy-tee", x: 58, y: 58, w: 22 }],
        hotspots: [{ productId: "wool-overcoat", x: 50, y: 30 }, { productId: "heavy-tee", x: 69, y: 66 }],
    },
    {
        id: "studio",
        title: "Look 02 — Studio day",
        note: "Oxford shirt, wide trousers, zero ironing.",
        bgVar: "--color-stone",
        garments: [{ productId: "oxford-shirt", x: 22, y: 10, w: 32 }, { productId: "wide-trouser", x: 54, y: 18, w: 26 }],
        hotspots: [{ productId: "oxford-shirt", x: 38, y: 28 }, { productId: "wide-trouser", x: 67, y: 50 }],
    },
    {
        id: "weekend",
        title: "Look 03 — Slow weekend",
        note: "Merino crew, softer every wash.",
        bgVar: "--color-olive",
        garments: [{ productId: "merino-knit", x: 32, y: 20, w: 38 }],
        hotspots: [{ productId: "merino-knit", x: 51, y: 40 }],
    },
    {
        id: "evening",
        title: "Look 04 — After hours",
        note: "Linen slip dress, cut on the bias.",
        bgVar: "--color-camel",
        garments: [{ productId: "slip-dress", x: 36, y: 8, w: 28 }],
        hotspots: [{ productId: "slip-dress", x: 50, y: 50 }],
    },
];

export const HEIGHT_OPTIONS = [
    { value: "150-160", label: "4'11\" – 5'3\"" },
    { value: "160-170", label: "5'3\" – 5'7\"" },
    { value: "170-180", label: "5'7\" – 5'11\"" },
    { value: "180-190", label: "5'11\" – 6'3\"" },
    { value: "190+", label: "6'3\" +" },
] as const;
export type HeightBand = (typeof HEIGHT_OPTIONS)[number]["value"];

export const BUILD_LABEL: Record<Build, string> = { slim: "Slim", regular: "Regular", athletic: "Athletic", curvy: "Curvy" };
export const FIT_LABEL: Record<FitPreference, string> = { close: "Close", true: "True to size", relaxed: "Relaxed" };

const HEIGHT_BASE: Record<HeightBand, number> = { "150-160": 0, "160-170": 1, "170-180": 2, "180-190": 3, "190+": 4 };
const BUILD_SHIFT: Record<Build, number> = { slim: -1, regular: 0, athletic: 0.5, curvy: 0.5 };
const FIT_SHIFT: Record<FitPreference, number> = { close: -0.5, true: 0, relaxed: 1 };
const SIZE_ORDER: readonly Size[] = ["XS", "S", "M", "L", "XL"];

/** Rule-based recommender; phase 2 replaces it with return-rate data per SKU. */
export function recommendSize(height: HeightBand, build: Build, fit: FitPreference): { size: Size; confidence: number } {
    const raw = HEIGHT_BASE[height] + BUILD_SHIFT[build] + FIT_SHIFT[fit];
    const idx = Math.min(SIZE_ORDER.length - 1, Math.max(0, Math.round(raw)));
    const confidence = 96 - Math.round(Math.abs(raw - Math.round(raw)) * 20) - (build === "curvy" || build === "athletic" ? 4 : 0);
    return { size: SIZE_ORDER[idx] ?? "M", confidence };
}

export const TRUE_COST = {
    productId: "wool-overcoat",
    ours: 395,
    traditional: 950,
    lines: [
        { label: "Materials", amount: 125 },
        { label: "Labor", amount: 70 },
        { label: "Shipping", amount: 14 },
        { label: "Duties & tax", amount: 46 },
        { label: "Our margin", amount: 140 },
    ],
} as const;

export const FASHION_MARQUEE = ["Free exchanges, 30 days", "Fit guaranteed", "Traceable to the mill", "Repairs for life", "Carbon-neutral shipping"] as const;

