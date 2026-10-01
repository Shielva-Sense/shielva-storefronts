import type { StoreSlug } from "@/features/storefront/types";

const STORES: readonly StoreSlug[] = ["beauty", "salon", "fashion"];

/**
 * SOLE owner of brand domains. BRAND_HOSTS="velour.shielva.ai=beauty,maisonnoor.shielva.ai=salon,…"
 * makes each brand domain serve its storefront at the root ("/" → /beauty, "/account" →
 * /beauty/account). Unset (dev) = path-based stores on one host.
 */
function brandHosts(): Map<string, StoreSlug> {
    const map = new Map<string, StoreSlug>();
    for (const pair of (process.env.BRAND_HOSTS ?? "").split(",")) {
        const [host, store] = pair.split("=").map((p) => p.trim().toLowerCase());
        if (host && store && (STORES as readonly string[]).includes(store)) map.set(host, store as StoreSlug);
    }
    return map;
}

export function storeForHost(host: string | null | undefined): StoreSlug | null {
    return host ? (brandHosts().get(host.toLowerCase()) ?? null) : null;
}

export function hostForStore(store: string): string | null {
    for (const [host, s] of brandHosts()) if (s === store) return host;
    return null;
}
