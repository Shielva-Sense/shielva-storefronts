import type { Tone } from "@/components/ui/StatusBadge";

export const ORDER_STATUS_TABS = [
    { id: "all", label: "All" },
    { id: "paid", label: "Paid" },
    { id: "pending", label: "Pending" },
    { id: "unfulfilled", label: "Unfulfilled" },
    { id: "fulfilled", label: "Fulfilled" },
    { id: "partially_refunded", label: "Partially refunded" },
    { id: "refunded", label: "Refunded" },
    { id: "cancelled", label: "Cancelled" },
] as const;

export type OrderStatusTab = (typeof ORDER_STATUS_TABS)[number]["id"];

export const ORDER_SORTS = ["created", "total", "name"] as const;
export type OrderSort = (typeof ORDER_SORTS)[number];

export const ORDERS_PAGE_SIZE = 20;

/** While a refund is in flight we poll the order until Shopify's webhook lands (min interval 5 s, max 30 s). */
export const REFUND_POLL = { intervalMs: 5_000, maxMs: 30_000 } as const;

const FINANCIAL_TONES: Record<string, Tone> = {
    paid: "success",
    pending: "warning",
    authorized: "info",
    partially_paid: "warning",
    partially_refunded: "info",
    refunded: "neutral",
    voided: "neutral",
};

export function financialTone(status: string): Tone {
    return FINANCIAL_TONES[status] ?? "neutral";
}

export function fulfillmentTone(status: string | null, cancelled: boolean): Tone {
    if (cancelled) return "danger";
    if (status === "fulfilled") return "success";
    if (status === "partial") return "info";
    return "warning";
}

export function fulfillmentLabel(status: string | null, cancelled: boolean): string {
    if (cancelled) return "Cancelled";
    if (!status) return "Unfulfilled";
    return status === "partial" ? "Partially fulfilled" : status.charAt(0).toUpperCase() + status.slice(1);
}

export function transactionTone(status: string): Tone {
    if (status === "success") return "success";
    if (status === "pending") return "warning";
    if (status === "failure" || status === "error") return "danger";
    return "neutral";
}
