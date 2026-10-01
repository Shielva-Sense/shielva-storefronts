export const SERVICE_CATEGORIES = ["hair", "color", "care", "bridal"] as const;
export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

export interface SalonService {
    id: string;
    category: ServiceCategory;
    name: string;
    minutes: number;
    from: number;
    description: string;
}

export interface Stylist {
    id: string;
    name: string;
    level: "Senior" | "Master" | "Creative Director";
    specialty: string;
    from: number;
    nextSlot: string;
}

/** Live booking catalogue from the API (/bookings/services). */
export interface BookableService {
    handle: string;
    name: string;
    category: string;
    minutes: number;
    priceCents: number;
    depositCents: number;
    description: string;
}
export interface BookableStaff {
    handle: string;
    name: string;
    level: string;
    specialty: string;
    services: string[];
}
export interface BookingCatalog {
    timezone: string;
    services: BookableService[];
    staff: BookableStaff[];
}
export interface Slot {
    label: string;
    startsAt: string;
}
export interface HoldInput {
    service: string;
    staff?: string;
    startsAt: string;
    name: string;
    email: string;
}
export interface HoldResult {
    bookingId: string;
    status: "held" | "confirmed";
    checkoutUrl: string | null;
}
