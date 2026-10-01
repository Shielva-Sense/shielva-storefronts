export interface AccountMe {
    email: string;
    name: string | null;
    ordersCount: number;
    totalSpentCents: number;
    memberships: { sku: string; status: string; currentPeriodEnd: string }[];
}

export interface AccountOrderLine {
    id: string;
    sku: string | null;
    title: string;
    variantTitle: string | null;
    quantity: number;
    priceCents: number;
    reviewed: boolean;
}

export interface AccountTransaction {
    id: string;
    kind: string;
    status: string;
    gateway: string;
    amountCents: number;
    currency: string;
    processedAt: string;
}

export interface AccountOrder {
    id: string;
    name: string;
    createdAt: string;
    financialStatus: string;
    fulfillmentStatus: string | null;
    cancelledAt: string | null;
    currency: string;
    totalCents: number;
    totalRefundedCents: number;
    lines: AccountOrderLine[];
    transactions: AccountTransaction[];
    refunds: { id: string; amountCents: number; note: string | null; processedAt: string }[];
    shipments: { status: string; trackingCompany: string | null; trackingNumber: string | null; trackingUrl: string | null; createdAt: string }[];
    timeline: { type: string; message: string; at: string }[];
    returns: { id: string; type: "return" | "exchange"; status: string; reason: string; lines: { sku: string; quantity: number }[]; createdAt: string }[];
    canReturn: boolean;
}

export interface AccountBooking {
    id: string;
    startsAt: string;
    endsAt: string;
    status: string;
    depositCents: number;
    service: string;
    stylist: string;
}

export interface ReturnRequest {
    orderId: string;
    type: "return" | "exchange";
    reason: string;
    lines: { sku: string; quantity: number }[];
}

export interface ReviewInput {
    sku: string;
    rating: number;
    body: string;
    authorName: string;
}
