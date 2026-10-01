import type { Review } from "@/core/types";
import type { BundleItem, LipShade, SkinTone, Undertone } from "./types";

export const BEAUTY_BRAND = "VELOUR";

/** Built-in copy used when the page builder has no value (and when the API is unreachable). */
export const BEAUTY_SECTION_DEFAULTS = {
    hero: { eyebrow: "New · The Velvet Lip collection", titleLine1: "Color that", titleLine2: "knows you.", lede: "Forty shades matched to your skin depth and undertone. Find yours in two taps — or swap it free." },
    shadeFinder: { eyebrow: "Shade finder", title: "Your shade, in two taps.", lede: "No more guessing from a screen. Tell us your depth and undertone — we rank all forty shades for you." },
    shadeRail: { title: "Nine shades. Zero guesswork." },
    values: { title: "Color, but make it kind." },
    bundle: { eyebrow: "The Everyday Edit", lede: "Build your five-minute face. Pick any three essentials and save up to 28%." },
    reviews: { eyebrow: "Real people, real shades" },
} as const;

/** Section order when the page builder is unreachable. */
export const BEAUTY_FALLBACK_SECTIONS = ["beauty.hero", "marquee", "beauty.shadeFinder", "beauty.shadeRail", "beauty.values", "beauty.bundle", "beauty.reviews"] as const;
export const BEAUTY_FREE_SHIPPING_AT = 50;
export const BUNDLE = { size: 3, price: 65 } as const;

export const BEAUTY_NAV = [
    { href: "#shade-finder", label: "Shade finder" },
    { href: "#shades", label: "The shades" },
    { href: "#edit", label: "Build a set" },
    { href: "#reviews", label: "Reviews" },
] as const;

export const BEAUTY_MARQUEE = [
    "40 inclusive shades",
    "Vegan formulas",
    "Cruelty-free, always",
    "12-hour velvet wear",
    "Dermatologist tested",
    "Free returns on shades",
] as const;

export const SKIN_TONE_META: Record<SkinTone, { label: string; cssVar: string }> = {
    fair: { label: "Fair", cssVar: "--skin-fair" },
    light: { label: "Light", cssVar: "--skin-light" },
    medium: { label: "Medium", cssVar: "--skin-medium" },
    tan: { label: "Tan", cssVar: "--skin-tan" },
    deep: { label: "Deep", cssVar: "--skin-deep" },
    rich: { label: "Rich", cssVar: "--skin-rich" },
};

export const UNDERTONE_HINT: Record<Undertone, string> = {
    warm: "Veins look green, gold jewelry pops",
    neutral: "A mix of both — lucky you",
    cool: "Veins look blue, silver jewelry pops",
};

export const LIP_SHADES: readonly LipShade[] = [
    { id: "velvet-lip-nude-rose", sku: "velvet-lip-nude-rose", productName: "Velvet Lip", name: "Nude Rose", finish: "Velvet matte", swatch: "var(--shade-nude-rose)", price: 28, undertone: "cool", bestFor: ["fair", "light", "medium"] },
    { id: "velvet-lip-bare-honey", sku: "velvet-lip-bare-honey", productName: "Velvet Lip", name: "Bare Honey", finish: "Satin", swatch: "var(--shade-bare-honey)", price: 28, undertone: "warm", bestFor: ["light", "medium", "tan"] },
    { id: "velvet-lip-cocoa-silk", sku: "velvet-lip-cocoa-silk", productName: "Velvet Lip", name: "Cocoa Silk", finish: "Satin", swatch: "var(--shade-cocoa-silk)", price: 28, undertone: "warm", bestFor: ["tan", "deep", "rich"] },
    { id: "velvet-lip-coral-fever", sku: "velvet-lip-coral-fever", productName: "Velvet Lip", name: "Coral Fever", finish: "Glaze", swatch: "var(--shade-coral-fever)", price: 30, undertone: "warm", bestFor: ["fair", "light", "medium", "tan"] },
    { id: "velvet-lip-velvet-berry", sku: "velvet-lip-velvet-berry", productName: "Velvet Lip", name: "Velvet Berry", finish: "Velvet matte", swatch: "var(--shade-velvet-berry)", price: 28, undertone: "cool", bestFor: ["medium", "tan", "deep", "rich"] },
    { id: "velvet-lip-ruby-noir", sku: "velvet-lip-ruby-noir", productName: "Velvet Lip", name: "Ruby Noir", finish: "Velvet matte", swatch: "var(--shade-ruby-noir)", price: 28, undertone: "neutral", bestFor: ["fair", "light", "medium", "tan", "deep", "rich"] },
    { id: "velvet-lip-mauve-muse", sku: "velvet-lip-mauve-muse", productName: "Velvet Lip", name: "Mauve Muse", finish: "Satin", swatch: "var(--shade-mauve-muse)", price: 28, undertone: "cool", bestFor: ["fair", "light", "medium"] },
    { id: "velvet-lip-spice-route", sku: "velvet-lip-spice-route", productName: "Velvet Lip", name: "Spice Route", finish: "Velvet matte", swatch: "var(--shade-spice-route)", price: 28, undertone: "warm", bestFor: ["medium", "tan", "deep"] },
    { id: "velvet-lip-plum-night", sku: "velvet-lip-plum-night", productName: "Velvet Lip", name: "Plum Night", finish: "Glaze", swatch: "var(--shade-plum-night)", price: 30, undertone: "neutral", bestFor: ["tan", "deep", "rich"] },
];

export const BUNDLE_ITEMS: readonly BundleItem[] = [
    { id: "skin-tint", name: "Second-Skin Tint", price: 38, tint: "var(--skin-medium)" },
    { id: "cheek-stain", name: "Flush Cheek Stain", price: 24, tint: "var(--shade-coral-fever)" },
    { id: "brow-gel", name: "Feather Brow Gel", price: 20, tint: "var(--shade-cocoa-silk)" },
    { id: "mascara", name: "Lift Mascara", price: 26, tint: "var(--color-plum-900)" },
    { id: "glow-balm", name: "Dew Glow Balm", price: 18, tint: "var(--shade-nude-rose)" },
    { id: "velvet-lip", name: "Velvet Lip (any shade)", price: 28, tint: "var(--shade-ruby-noir)" },
];

export const BEAUTY_RATING = { average: 4.8, count: 12480, distribution: [0.82, 0.12, 0.04, 0.01, 0.01] } as const;

export const BEAUTY_REVIEWS: readonly Review[] = [
    { id: "r1", author: "Aanya K.", rating: 5, body: "The shade finder got it right first try. Ruby Noir is my new signature.", meta: "Medium · warm · Verified buyer" },
    { id: "r2", author: "Meera S.", rating: 5, body: "Finally a matte that doesn't crack by lunch. Survived a wedding and a dance floor.", meta: "Deep · neutral · Verified buyer" },
    { id: "r3", author: "Riya P.", rating: 4, body: "Plum Night glaze is unreal under evening light. Wish the tube was refillable.", meta: "Tan · cool · Verified buyer" },
    { id: "r4", author: "Zoya M.", rating: 5, body: "Bought the Everyday Edit — saved money and my morning routine is 5 minutes now.", meta: "Fair · cool · Verified buyer" },
    { id: "r5", author: "Ishita R.", rating: 5, body: "Nude Rose is the rare nude that doesn't wash me out.", meta: "Light · neutral · Verified buyer" },
    { id: "r6", author: "Tara D.", rating: 5, body: "Vegan, cruelty-free, and the formula feels like nothing. Bought three.", meta: "Rich · warm · Verified buyer" },
];

export const BEAUTY_VALUES = [
    { title: "Built for every tone", body: "Every shade is tested on six skin depths and three undertones before it ships." },
    { title: "Skin-first formulas", body: "Squalane, hyaluronic acid and vitamin E — color that cares for the lip underneath." },
    { title: "Try without risk", body: "Wrong shade? Swap it free within 30 days. No forms, no questions." },
] as const;

/** Rank shades for a tone/undertone pair: tone match first, then undertone affinity. */
export function matchShades(shades: readonly LipShade[], tone: SkinTone, undertone: Undertone, limit = 3): LipShade[] {
    const score = (s: LipShade): number =>
        (s.bestFor.includes(tone) ? 2 : 0) + (s.undertone === undertone ? 1.5 : s.undertone === "neutral" ? 0.75 : 0);
    return [...shades].sort((a, b) => score(b) - score(a)).slice(0, limit);
}


