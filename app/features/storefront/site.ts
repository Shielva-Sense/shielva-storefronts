import { BEAUTY_NAV } from "@/features/beauty/constants";
import { FASHION_NAV } from "@/features/fashion/constants";
import { SALON_LOCATION, SALON_NAV } from "@/features/salon/constants";
import type { StoreSlug } from "./types";

/** Header menu + footer of a storefront. Stored per tenant (`/site`); these are the defaults. */
export interface SiteLink {
    label: string;
    /** "" = plain text; "/path", "#anchor" or "https://…". */
    href: string;
}
export interface SiteFooter {
    tagline: string;
    columns: { title: string; links: SiteLink[] }[];
    legal: string;
}
/** Short UI labels outside page sections. Keys must match the API's SITE_LABEL_KEYS. */
export const SITE_LABEL_KEYS = ["headerCta", "mobileCta", "newsletterCta"] as const;
export type SiteLabelKey = (typeof SITE_LABEL_KEYS)[number];

export interface SiteChrome {
    nav: SiteLink[];
    footer: SiteFooter;
    labels: Record<SiteLabelKey, string>;
}
export interface StoredSite {
    nav: SiteLink[] | null;
    footer: SiteFooter | null;
    labels?: Partial<Record<SiteLabelKey, string>> | null;
}

const text = (label: string): SiteLink => ({ label, href: "" });

export const DEFAULT_SITE: Record<StoreSlug, SiteChrome> = {
    beauty: {
        nav: BEAUTY_NAV.map((n) => ({ ...n })),
        footer: {
            tagline: "Inclusive color, skin-first formulas. Made for every tone, tested on every tone.",
            columns: [
                { title: "Shop", links: [{ label: "Lips", href: "#shades" }, text("Face"), text("Cheeks"), { label: "Sets & gifts", href: "#edit" }] },
                { title: "Help", links: [text("Shade swaps"), text("Shipping"), { label: "Track order", href: "/beauty/account" }, text("Contact")] },
                { title: "About", links: [text("Our formulas"), text("Cruelty-free pledge"), { label: "Journal", href: "/beauty/journal" }] },
            ],
            legal: "© 2026 VELOUR Cosmetics — a Shielva storefront demo.",
        },
        labels: { headerCta: "", mobileCta: "Find my shade", newsletterCta: "Get 10% off" },
    },
    salon: {
        nav: SALON_NAV.map((n) => ({ ...n })),
        footer: {
            tagline: "Hair & color studio in SoHo. Considered cuts, honest prices, no rush.",
            columns: [
                { title: "Studio", links: [{ label: "Services & prices", href: "#services" }, { label: "Stylists", href: "#stylists" }, text("Gift cards"), text("Careers")] },
                { title: "Visit", links: [text(SALON_LOCATION.street), text(SALON_LOCATION.city), text(SALON_LOCATION.phone)] },
                { title: "Policies", links: [text("Cancellation"), text("Color guarantee"), text("Privacy")] },
            ],
            legal: "© 2026 Maison Noor — a Shielva storefront demo.",
        },
        labels: { headerCta: "Book now", mobileCta: "Book an appointment", newsletterCta: "Get last-minute slots" },
    },
    fashion: {
        nav: FASHION_NAV.map((n) => ({ ...n })),
        footer: {
            tagline: "Fewer, better garments. Traceable to the mill, priced at their true cost, repaired for life.",
            columns: [
                { title: "Shop", links: [{ label: "Outerwear", href: "#shop" }, { label: "Shirts", href: "#shop" }, { label: "Knitwear", href: "#shop" }, { label: "Trousers", href: "#shop" }] },
                { title: "Care", links: [{ label: "Fit guarantee", href: "#fit" }, text("Free exchanges"), text("Repairs"), text("Resale")] },
                { title: "Transparency", links: [text("Our mills"), { label: "True cost", href: "#pricing" }, text("Impact report")] },
            ],
            legal: "© 2026 ATELIER NORD — a Shielva storefront demo.",
        },
        labels: { headerCta: "", mobileCta: "", newsletterCta: "Join" },
    },
};

/** Newsletter field label + confirmation stay in code; the button label is a site label. */
export const NEWSLETTER: Record<StoreSlug, { label: string; success: string }> = {
    beauty: { label: "Email address", success: "You're in — check your inbox for 10% off." },
    salon: { label: "Email address", success: "Done — we'll email you when a chair frees up." },
    fashion: { label: "Email address", success: "Welcome — early access to every drop is yours." },
};

export function resolveSite(store: StoreSlug, stored: StoredSite | null): SiteChrome {
    const d = DEFAULT_SITE[store];
    return { nav: stored?.nav ?? d.nav, footer: stored?.footer ?? d.footer, labels: { ...d.labels, ...(stored?.labels ?? {}) } };
}

/** In-page anchors only exist on the storefront home; elsewhere they point back to it. */
export function absoluteHref(store: StoreSlug, href: string): string {
    return href.startsWith("#") ? `/${store}${href}` : href;
}
