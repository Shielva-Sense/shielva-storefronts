import { apiFetch } from "@/core/api-client";
import { BOOKING_WINDOW_DAYS } from "./constants";
import type { Booking, BookingsResponse, BookingStatus, Closure, ClosureInput, ItemsResponse, Membership, Service, ServiceInput, StaffInput, StaffMember } from "./types";

export type * from "./types";

export async function fetchBookings(tenant: string, from: string): Promise<BookingsResponse> {
    const qs = new URLSearchParams({ from, days: String(BOOKING_WINDOW_DAYS) });
    return apiFetch<BookingsResponse>(`/admin/bookings?${qs.toString()}`, { tenant });
}

export async function updateBookingStatus(tenant: string, id: Booking["id"], status: BookingStatus): Promise<void> {
    await apiFetch(`/admin/bookings/${encodeURIComponent(id)}`, { tenant, method: "PATCH", body: { status } });
}

export async function fetchServices(tenant: string): Promise<Service[]> {
    const res = await apiFetch<ItemsResponse<Service>>("/admin/services", { tenant });
    return res.items;
}

export async function saveService(tenant: string, input: ServiceInput): Promise<Service> {
    return apiFetch<Service>(`/admin/services/${encodeURIComponent(input.handle)}`, { tenant, method: "PUT", body: input });
}

export async function fetchStaff(tenant: string): Promise<StaffMember[]> {
    const res = await apiFetch<ItemsResponse<StaffMember>>("/admin/staff", { tenant });
    return res.items;
}

export async function saveStaff(tenant: string, input: StaffInput): Promise<void> {
    await apiFetch(`/admin/staff/${encodeURIComponent(input.handle)}`, { tenant, method: "PUT", body: input });
}

export async function fetchClosures(tenant: string): Promise<Closure[]> {
    const res = await apiFetch<ItemsResponse<Closure>>("/admin/closures", { tenant });
    return res.items;
}

export async function addClosure(tenant: string, input: ClosureInput): Promise<Closure> {
    return apiFetch<Closure>("/admin/closures", { tenant, method: "POST", body: input });
}

export async function deleteClosure(tenant: string, id: string): Promise<void> {
    await apiFetch(`/admin/closures/${encodeURIComponent(id)}`, { tenant, method: "DELETE" });
}

export async function fetchMemberships(tenant: string): Promise<Membership[]> {
    const res = await apiFetch<ItemsResponse<Membership>>("/admin/memberships", { tenant });
    return res.items;
}
