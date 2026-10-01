"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { CartLine } from "@/core/types";
import { saveCart } from "@/features/account/api";
import { useCustomerSession } from "@/features/account/hooks";
import { trackEvent } from "@/features/storefront/api";
import { forgetPendingCheckout, readPendingCheckout, useCheckout, useCheckoutStatus } from "@/features/storefront/hooks";
import { toast } from "@/components/ui/Toast";
import type { StoreSlug } from "@/features/storefront/types";

type NewLine = Omit<CartLine, "qty" | "id"> & { id?: string };

interface CartContextValue {
    lines: CartLine[];
    count: number;
    subtotal: number;
    isOpen: boolean;
    open: () => void;
    close: () => void;
    add: (line: NewLine, qty?: number) => void;
    setQty: (id: string, qty: number) => void;
    replace: (lines: CartLine[]) => void;
    checkout: () => void;
    checkingOut: boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

const lineKey = (l: Pick<CartLine, "sku" | "variant" | "components">): string => [l.sku, l.variant ?? "", (l.components ?? []).join("+")].join("::");

function isCartLine(value: unknown): value is CartLine {
    if (typeof value !== "object" || value === null) return false;
    const v = value as Record<string, unknown>;
    return typeof v.id === "string" && typeof v.sku === "string" && typeof v.name === "string" && typeof v.price === "number" && typeof v.qty === "number";
}

interface CartProviderProps {
    store: StoreSlug;
    experiments: Record<string, "A" | "B">;
    children: ReactNode;
}

/**
 * Guest cart in browser storage; once the shopper signs in the same lines are mirrored to
 * their account cart (server). Checkout hands the lines to Shopify's hosted checkout.
 */
export function CartProvider({ store, experiments, children }: CartProviderProps): React.JSX.Element {
    const storageKey = `shielva-cart-v2-${store}`;
    const [lines, setLines] = useState<CartLine[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [hydrated, setHydrated] = useState(false);
    const session = useCustomerSession(store);
    const signedIn = Boolean(session.data);
    const checkoutMutation = useCheckout(store, experiments);
    const saveTimer = useRef<number | null>(null);
    const [pendingCheckout, setPendingCheckout] = useState<string | null>(null);
    const checkoutStatus = useCheckoutStatus(store, pendingCheckout);

    useEffect(() => {
        try {
            const raw = window.localStorage.getItem(storageKey);
            const parsed: unknown = raw ? JSON.parse(raw) : [];
            // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from browser storage, unavailable during SSR
            if (Array.isArray(parsed)) setLines(parsed.filter(isCartLine));
        } catch {
            // Storage blocked (private mode) — cart simply starts empty.
        }
        setPendingCheckout(readPendingCheckout(store)?.id ?? null);
        setHydrated(true);
    }, [storageKey, store]);

    // Shopify's checkout doesn't send the shopper back: once their checkout becomes an order
    // (orders webhook), empty the bag on whatever page of the storefront they're on.
    const orderName = checkoutStatus.data?.status === "ordered" ? (checkoutStatus.data.orderName ?? "") : null;
    useEffect(() => {
        if (orderName === null) return;
        forgetPendingCheckout(store);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- reacting to the server confirming the order
        setLines([]);
        setPendingCheckout(null);
        toast.success(orderName ? `Order ${orderName} placed — thank you! Your bag is empty again.` : "Order placed — thank you!");
    }, [orderName, store]);

    useEffect(() => {
        if (!hydrated) return;
        try {
            window.localStorage.setItem(storageKey, JSON.stringify(lines));
        } catch {
            // Storage blocked — cart stays in memory for this visit.
        }
        if (!signedIn) return;
        if (saveTimer.current) window.clearTimeout(saveTimer.current);
        saveTimer.current = window.setTimeout(() => void saveCart(store, lines).catch(() => undefined), 600);
    }, [hydrated, lines, storageKey, signedIn, store]);

    const add = useCallback(
        (line: NewLine, qty = 1) => {
            const key = lineKey(line);
            setLines((prev) => {
                const existing = prev.find((l) => lineKey(l) === key);
                if (existing) return prev.map((l) => (l === existing ? { ...l, qty: l.qty + qty } : l));
                return [...prev, { ...line, id: key, qty }];
            });
            setIsOpen(true);
            void trackEvent(store, "add_to_cart");
        },
        [store],
    );

    const setQty = useCallback((id: string, qty: number) => {
        setLines((prev) => (qty <= 0 ? prev.filter((l) => l.id !== id) : prev.map((l) => (l.id === id ? { ...l, qty } : l))));
    }, []);

    const { mutate: runCheckout, isPending: checkingOut } = checkoutMutation;
    const checkout = useCallback(() => {
        runCheckout(
            lines.map((l) => ({
                sku: l.sku,
                qty: l.qty,
                name: l.name,
                ...(l.variant ? { variant: l.variant } : {}),
                ...(l.components ? { components: l.components } : {}),
            })),
        );
    }, [lines, runCheckout]);

    const value = useMemo<CartContextValue>(() => {
        const count = lines.reduce((n, l) => n + l.qty, 0);
        const subtotal = lines.reduce((n, l) => n + l.qty * l.price, 0);
        return { lines, count, subtotal, isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false), add, setQty, replace: setLines, checkout, checkingOut };
    }, [lines, isOpen, add, setQty, checkout, checkingOut]);

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
    return ctx;
}

export function mergeCarts(local: CartLine[], remote: CartLine[]): CartLine[] {
    const merged = new Map<string, CartLine>();
    for (const l of [...remote, ...local]) {
        const key = lineKey(l);
        const prior = merged.get(key);
        merged.set(key, prior ? { ...prior, qty: Math.max(prior.qty, l.qty) } : { ...l, id: key });
    }
    return [...merged.values()];
}
