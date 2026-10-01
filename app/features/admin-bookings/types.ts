/** Admin bookings domain (service businesses) — interfaces only. */

export type BookingStatus = "held" | "confirmed" | "cancelled" | "no_show" | "completed" | "expired";

export interface Booking {
    id: string;
    serviceId: string;
    staffId: string;
    customerEmail: string;
    customerName: string;
    startsAt: string;
    endsAt: string;
    status: BookingStatus;
    holdExpiresAt: string | null;
    depositCents: number;
    shopifyOrderId: string | null;
    createdAt: string;
    updatedAt: string;
    /** Joined service name. */
    service: string;
    /** Joined stylist name. */
    stylist: string;
}

export interface BookingsResponse {
    /** IANA time zone of the store — every booking time is displayed in it. */
    timezone: string;
    items: Booking[];
}

export interface Service {
    id: string;
    handle: string;
    name: string;
    category: string;
    minutes: number;
    priceCents: number;
    depositCents: number;
    description: string;
    active: boolean;
}

export type ServiceInput = Omit<Service, "id">;

export interface StaffShift {
    weekday: number;
    startMin: number;
    endMin: number;
}

export interface StaffMember {
    id: string;
    handle: string;
    name: string;
    level: string;
    specialty: string;
    active: boolean;
    hours: StaffShift[];
    serviceHandles: string[];
}

export type StaffInput = Omit<StaffMember, "id">;

export interface Closure {
    id: string;
    staffId: string | null;
    date: string;
    reason: string;
}

export type ClosureInput = Omit<Closure, "id">;

export type MembershipStatus = "active" | "expired" | "cancelled";

export interface Membership {
    id: string;
    customerEmail: string;
    sku: string;
    status: MembershipStatus;
    currentPeriodEnd: string;
    shopifyOrderId: string;
    createdAt: string;
}

export interface ItemsResponse<T> {
    items: T[];
}
