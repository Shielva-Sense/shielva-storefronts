import type { Paged } from "@/features/admin-orders/types";

export interface Customer {
    id: string;
    email: string;
    name: string | null;
    phone: string | null;
    shopifyCustomerId: string | null;
    acceptsMarketing: boolean;
    tags: string[];
    ordersCount: number;
    totalSpentCents: number;
    firstOrderAt: string | null;
    lastOrderAt: string | null;
    firstStorefrontVariant: string | null;
    createdAt: string;
    updatedAt: string;
}

export type CustomersPage = Paged<Customer>;

export interface CustomersQuery {
    q: string;
    segment: string;
    sort: string;
    dir: "asc" | "desc";
    page: number;
    size: number;
}

export interface CustomerOrder {
    id: string;
    name: string;
    totalCents: number;
    financialStatus: string;
    fulfillmentStatus: string | null;
    createdAt: string;
}

export interface CustomerBooking {
    id: string;
    customerName: string;
    startsAt: string;
    endsAt: string;
    status: string;
    depositCents: number;
    shopifyOrderId: string | null;
}

export interface CustomerMembership {
    id: string;
    sku: string;
    status: "active" | "expired" | "cancelled";
    currentPeriodEnd: string;
    shopifyOrderId: string;
}

export interface CustomerReview {
    id: string;
    sku: string;
    rating: number;
    body: string;
    status: "pending" | "approved" | "rejected";
    verified: boolean;
    createdAt: string;
}

export interface CustomerDetail {
    profile: Customer;
    orders: CustomerOrder[];
    bookings: CustomerBooking[];
    memberships: CustomerMembership[];
    reviews: CustomerReview[];
}

export interface SegmentRules {
    minOrders?: number;
    maxOrders?: number;
    minSpentCents?: number;
    lastOrderWithinDays?: number;
    lastOrderOlderThanDays?: number;
    acceptsMarketing?: boolean;
    tag?: string;
}

export interface Segment {
    id: string;
    name: string;
    rules: SegmentRules;
    count: number;
}

export interface SegmentsResponse {
    items: Segment[];
}

export interface SegmentInput {
    name: string;
    rules: SegmentRules;
}

export interface CsvDownload {
    filename: string;
    blob: Blob;
}
