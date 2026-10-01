/** Maps admin theme keys → CSS custom properties (mirrors the API's THEME_KEYS). */
export const THEME_VARS = {
    brand: "--color-brand-500",
    brandStrong: "--color-brand-600",
    accent: "--color-accent",
    background: "--color-bg",
    surface: "--color-surface",
    text: "--color-text",
    textMuted: "--color-text-muted",
    radius: "--btn-radius",
} as const;

export const THEME_VALUE_RE = /^(#[0-9a-f]{6}|\d{1,4}px)$/i;

export const STORE_NAMES = { beauty: "VELOUR", salon: "Maison Noor", fashion: "ATELIER NORD" } as const;

export const ANON_COOKIE = "sf_aid";
/** Presence only — whether to ship the inline editor. Every save is authorised by the API. */
export const ADMIN_COOKIE = "sf_admin";
/** Id prefix of the built-in sections rendered when the API is unreachable. */
export const FALLBACK_SECTION_PREFIX = "default-";

/** Product photo hosts the storefront renders with next/image (mirrored in next.config images.remotePatterns). */
export const MEDIA_HOSTS = ["cdn.shopify.com"] as const;

export function isRenderableMedia(url: string | undefined): url is string {
    if (!url) return false;
    try {
        const u = new URL(url);
        return u.protocol === "https:" && (MEDIA_HOSTS as readonly string[]).includes(u.hostname);
    } catch {
        return false;
    }
}

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
/** Admin color attribute → safe CSS color (hex only), else the fallback (a token var). */
export function cssColor(value: string | undefined, fallback: string): string {
    return value && HEX_COLOR.test(value) ? value : fallback;
}

/** Browser storage key of the checkout the shopper left for (cleared once it becomes an order). */
export const pendingCheckoutKey = (store: string): string => `shielva-checkout-${store}`;
/** Stop watching a checkout nobody completed after this long. */
export const PENDING_CHECKOUT_TTL_MS = 24 * 60 * 60 * 1000;
/** How often an open tab re-checks while a checkout is pending (≥ 5 s polling rule). */
export const CHECKOUT_STATUS_POLL_MS = 15_000;
