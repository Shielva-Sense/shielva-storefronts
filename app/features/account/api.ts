import { apiFetch } from "@/core/api-client";
import type { CartLine } from "@/core/types";
import type { StoreSlug } from "../storefront/types";
import type { AccountBooking, AccountMe, AccountOrder, ReturnRequest, ReviewInput } from "./types";

export type { AccountBooking, AccountMe, AccountOrder, ReturnRequest, ReviewInput } from "./types";

export async function requestCode(store: StoreSlug, email: string): Promise<void> {
    await apiFetch("/customer/login/request", { method: "POST", storefront: store, body: { email } });
}
export async function verifyCode(store: StoreSlug, email: string, code: string): Promise<{ email: string }> {
    return apiFetch("/customer/login/verify", { method: "POST", storefront: store, body: { email, code } });
}
export async function logout(store: StoreSlug): Promise<void> {
    await apiFetch("/customer/logout", { method: "POST", storefront: store });
}
/** Signed-in email for this storefront, or null. Never errors for anonymous visitors. */
export async function fetchSession(store: StoreSlug): Promise<string | null> {
    return (await apiFetch<{ email: string | null }>("/customer/session", { storefront: store })).email;
}
export async function fetchMe(store: StoreSlug): Promise<AccountMe> {
    return apiFetch("/customer/me", { storefront: store });
}
export async function fetchOrders(store: StoreSlug): Promise<AccountOrder[]> {
    return (await apiFetch<{ items: AccountOrder[] }>("/customer/orders", { storefront: store })).items;
}
export async function fetchBookings(store: StoreSlug): Promise<AccountBooking[]> {
    return (await apiFetch<{ items: AccountBooking[] }>("/customer/bookings", { storefront: store })).items;
}
export async function cancelBooking(store: StoreSlug, id: string): Promise<void> {
    await apiFetch(`/customer/bookings/${id}/cancel`, { method: "POST", storefront: store });
}
export async function requestReturn(store: StoreSlug, body: ReturnRequest): Promise<void> {
    await apiFetch("/customer/returns", { method: "POST", storefront: store, body });
}
export async function submitReview(store: StoreSlug, body: ReviewInput): Promise<void> {
    await apiFetch("/customer/reviews", { method: "POST", storefront: store, body });
}
export async function fetchCart(store: StoreSlug): Promise<CartLine[]> {
    const res = await apiFetch<{ lines: (CartLine & { sku: string })[] }>("/customer/cart", { storefront: store });
    return res.lines.map((l) => ({ ...l, id: l.sku }));
}
export async function saveCart(store: StoreSlug, lines: CartLine[]): Promise<void> {
    await apiFetch("/customer/cart", {
        method: "PUT",
        storefront: store,
        body: { lines: lines.map((l) => ({ sku: l.sku ?? l.id, name: l.name, ...(l.variant ? { variant: l.variant } : {}), price: l.price, qty: l.qty })) },
    });
}
