import { apiFetch } from "@/core/api-client";
import type { OrderDetail, OrdersPage, OrdersQuery, RefundInput, RefundResult } from "./types";

export type { Order, OrderDetail, OrderEvent, OrderLine, OrderListItem, OrderRefund, OrdersPage, OrdersQuery, OrderShipment, OrderTransaction, RefundInput, RefundResult } from "./types";

export async function fetchOrders(tenant: string, query: OrdersQuery): Promise<OrdersPage> {
    const qs = new URLSearchParams({ status: query.status, sort: query.sort, dir: query.dir, page: String(query.page), size: String(query.size) });
    if (query.q) qs.set("q", query.q);
    return apiFetch<OrdersPage>(`/admin/orders?${qs.toString()}`, { tenant });
}

export async function fetchOrder(tenant: string, id: string): Promise<OrderDetail> {
    return apiFetch<OrderDetail>(`/admin/orders/${encodeURIComponent(id)}`, { tenant });
}

/** Refund executes on Shopify (Shopify Payments moves the money); our copy updates from the refunds/create webhook. */
export async function refundOrder(tenant: string, id: string, input: RefundInput): Promise<RefundResult> {
    return apiFetch<RefundResult>(`/admin/orders/${encodeURIComponent(id)}/refund`, { method: "POST", tenant, body: input });
}
