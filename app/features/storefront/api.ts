import { apiFetch } from "@/core/api-client";
import type { CheckoutLine, StoreSlug } from "./types";

export type { CheckoutLine, StoreSlug } from "./types";

export type EventType = "page_view" | "add_to_cart" | "variant_exposure";

export async function createCheckout(store: StoreSlug, lines: CheckoutLine[], experiments: Record<string, "A" | "B">): Promise<{ checkoutId: string; checkoutUrl: string }> {
    return apiFetch("/checkout", { method: "POST", storefront: store, body: { lines, experiments } });
}

export interface CheckoutStatus {
    status: "open" | "ordered";
    orderName?: string;
}

export async function fetchCheckoutStatus(store: StoreSlug, id: string): Promise<CheckoutStatus> {
    return apiFetch<CheckoutStatus>(`/checkout/${encodeURIComponent(id)}/status`, { storefront: store });
}

/** Fire-and-forget analytics beacon; failures never affect the shopper. */
export async function trackEvent(store: StoreSlug, type: EventType, extra: { sectionId?: string; variant?: "A" | "B" } = {}): Promise<void> {
    try {
        await apiFetch("/events", { method: "POST", storefront: store, keepalive: true, body: { type, path: window.location.pathname, ...extra } });
    } catch {
        // Analytics must never break the storefront.
    }
}
