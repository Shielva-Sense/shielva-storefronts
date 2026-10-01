import { apiFetch } from "@/core/api-client";
import type { BookingCatalog, HoldInput, HoldResult, Slot } from "./types";

export type { BookingCatalog, HoldInput, HoldResult, Slot } from "./types";

const STORE = "salon";

export async function fetchBookingCatalog(): Promise<BookingCatalog> {
    return apiFetch("/bookings/services", { storefront: STORE });
}

export async function fetchAvailability(service: string, date: string, staff: string | null): Promise<Slot[]> {
    const qs = new URLSearchParams({ service, date, ...(staff ? { staff } : {}) });
    return (await apiFetch<{ slots: Slot[] }>(`/bookings/availability?${qs.toString()}`, { storefront: STORE })).slots;
}

export async function holdBooking(input: HoldInput): Promise<HoldResult> {
    return apiFetch("/bookings/hold", { method: "POST", storefront: STORE, body: input });
}
