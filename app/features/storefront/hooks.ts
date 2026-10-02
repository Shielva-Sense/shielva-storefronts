"use client";

import { useMutation, useQuery, type UseQueryResult } from "@tanstack/react-query";
import { toast } from "@/components/ui/Toast";
import { openOutsideFrame } from "@/core/frame";
import { queryKeys } from "@/core/query-keys";
import { createCheckout, fetchCheckoutStatus, type CheckoutStatus } from "./api";
import { CHECKOUT_STATUS_POLL_MS, PENDING_CHECKOUT_TTL_MS, pendingCheckoutKey } from "./constants";
import type { CheckoutLine, StoreSlug } from "./types";

/** Hands the cart to Shopify's hosted checkout (Shopify Payments). No local cache to patch — redirect on success. */
export function useCheckout(store: StoreSlug, experiments: Record<string, "A" | "B">) {
    return useMutation({
        mutationFn: (lines: CheckoutLine[]) => createCheckout(store, lines, experiments),
        onSuccess: ({ checkoutId, checkoutUrl }) => {
            rememberPendingCheckout(store, checkoutId);
            openOutsideFrame(checkoutUrl);
        },
        onError: (err: Error) => toast.error(err.message),
    });
}

export interface PendingCheckout {
    id: string;
    at: number;
}

export function readPendingCheckout(store: StoreSlug): PendingCheckout | null {
    try {
        const parsed: unknown = JSON.parse(window.localStorage.getItem(pendingCheckoutKey(store)) ?? "null");
        if (!parsed || typeof parsed !== "object") return null;
        const { id, at } = parsed as Record<string, unknown>;
        if (typeof id !== "string" || typeof at !== "number" || Date.now() - at > PENDING_CHECKOUT_TTL_MS) return null;
        return { id, at };
    } catch {
        return null;
    }
}

function rememberPendingCheckout(store: StoreSlug, id: string): void {
    try {
        window.localStorage.setItem(pendingCheckoutKey(store), JSON.stringify({ id, at: Date.now() } satisfies PendingCheckout));
    } catch {
        // Storage blocked — the bag simply isn't auto-cleared after ordering.
    }
}

export function forgetPendingCheckout(store: StoreSlug): void {
    try {
        window.localStorage.removeItem(pendingCheckoutKey(store));
    } catch {
        // Storage blocked — nothing to forget.
    }
}

/** Watches the checkout the shopper left for; resolves to "ordered" once Shopify's order webhook links it. */
export function useCheckoutStatus(store: StoreSlug, id: string | null): UseQueryResult<CheckoutStatus> {
    return useQuery({
        queryKey: queryKeys.store.checkoutStatus(store, id ?? "none"),
        queryFn: () => fetchCheckoutStatus(store, id as string),
        enabled: id !== null,
        staleTime: 0,
        refetchOnWindowFocus: true,
        refetchInterval: (q) => (q.state.data?.status === "ordered" ? false : CHECKOUT_STATUS_POLL_MS),
    });
}
