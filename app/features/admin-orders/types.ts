import type { ReturnRecord } from "@/features/admin-postpurchase/types";

export interface OrderListItem {
    id: string;
    name: string;
    email: string | null;
    customerName: string | null;
    financialStatus: string;
    fulfillmentStatus: string | null;
    cancelledAt: string | null;
    totalCents: number;
    totalRefundedCents: number;
    currency: string;
    createdAt: string;
}

export interface Paged<T> {
    items: T[];
    page: number;
    size: number;
    total: number;
    pages: number;
}

export type OrdersPage = Paged<OrderListItem>;

export interface OrdersQuery {
    q: string;
    status: string;
    sort: string;
    dir: "asc" | "desc";
    page: number;
    size: number;
}

export interface Order {
    id: string;
    shopifyOrderId: string;
    name: string;
    email: string | null;
    customerName: string | null;
    financialStatus: string;
    fulfillmentStatus: string | null;
    cancelledAt: string | null;
    currency: string;
    subtotalCents: number;
    totalCents: number;
    discountCents: number;
    taxCents: number;
    shippingCents: number;
    totalRefundedCents: number;
    storefront: string | null;
    shopifyCreatedAt: string;
    shopifyUpdatedAt: string;
}

export interface OrderLine {
    id: string;
    shopifyLineId: string;
    sku: string | null;
    title: string;
    variantTitle: string | null;
    quantity: number;
    priceCents: number;
}

export interface OrderTransaction {
    id: string;
    shopifyTransactionId: string;
    kind: string;
    status: string;
    gateway: string;
    amountCents: number;
    currency: string;
    errorCode: string | null;
    processedAt: string;
}

export interface OrderRefund {
    id: string;
    shopifyRefundId: string;
    amountCents: number;
    note: string | null;
    lines: { sku: string | null; quantity: number }[];
    processedAt: string;
}

export interface OrderShipment {
    id: string;
    shopifyFulfillmentId: string;
    status: string;
    trackingCompany: string | null;
    trackingNumber: string | null;
    trackingUrl: string | null;
    createdAtShopify: string;
}

export interface OrderEvent {
    id: number;
    type: string;
    message: string;
    source: "shopify" | "admin" | "customer" | "system";
    occurredAt: string;
}

export interface OrderDetail {
    order: Order;
    lines: OrderLine[];
    transactions: OrderTransaction[];
    refunds: OrderRefund[];
    shipments: OrderShipment[];
    timeline: OrderEvent[];
    returns: Omit<ReturnRecord, "orderName" | "currency">[];
}

export interface RefundInput {
    amountCents: number;
    note: string;
    lines: { lineId: string; quantity: number }[];
}

export interface RefundResult {
    refundId: string;
}
