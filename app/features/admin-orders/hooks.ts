"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient, type UseMutationResult, type UseQueryResult } from "@tanstack/react-query";
import { toast } from "@/components/ui/Toast";
import type { ApiError } from "@/core/api-client";
import { queryKeys } from "@/core/query-keys";
import { fetchOrder, fetchOrders, refundOrder } from "./api";
import { REFUND_POLL } from "./constants";
import type { OrderDetail, OrdersPage, OrdersQuery, RefundInput, RefundResult } from "./types";

export function useOrders(tenant: string, query: OrdersQuery): UseQueryResult<OrdersPage, ApiError> {
    return useQuery<OrdersPage, ApiError>({
        queryKey: queryKeys.admin.orders(tenant, { ...query }),
        queryFn: () => fetchOrders(tenant, query),
        placeholderData: keepPreviousData,
    });
}

/** While a refund is in flight: poll every 5 s until the refunded total moves off `baselineRefundedCents` or `until` passes. */
export interface RefundPoll {
    until: number;
    baselineRefundedCents: number;
}

export function useOrder(tenant: string, id: string, poll: RefundPoll | null): UseQueryResult<OrderDetail, ApiError> {
    return useQuery<OrderDetail, ApiError>({
        queryKey: queryKeys.admin.order(tenant, id),
        queryFn: () => fetchOrder(tenant, id),
        refetchInterval: (query) =>
            poll !== null && Date.now() < poll.until && query.state.data?.order.totalRefundedCents === poll.baselineRefundedCents ? REFUND_POLL.intervalMs : false,
    });
}

interface RefundContext {
    prev: OrderDetail | undefined;
}

export function useRefundOrder(tenant: string, id: string): UseMutationResult<RefundResult, ApiError, RefundInput, RefundContext> {
    const qc = useQueryClient();
    const key = queryKeys.admin.order(tenant, id);
    return useMutation<RefundResult, ApiError, RefundInput, RefundContext>({
        mutationFn: (input) => refundOrder(tenant, id, input),
        onMutate: async (input) => {
            await qc.cancelQueries({ queryKey: key });
            const prev = qc.getQueryData<OrderDetail>(key);
            // Optimistic timeline entry; the refund row itself only exists once Shopify's webhook arrives.
            qc.setQueryData<OrderDetail>(key, (old) =>
                old
                    ? {
                          ...old,
                          timeline: [
                              ...old.timeline,
                              { id: -Date.now(), type: "refund_requested", message: `Refund of ${(input.amountCents / 100).toFixed(2)} ${old.order.currency} sent to Shopify: ${input.note}`, source: "admin", occurredAt: new Date().toISOString() },
                          ],
                      }
                    : old,
            );
            return { prev };
        },
        onError: (err, _input, ctx) => {
            if (ctx?.prev) qc.setQueryData<OrderDetail>(key, ctx.prev);
            toast.error(`Refund failed: ${err.message}`);
        },
        onSuccess: () => toast.success("Refund sent to Shopify. This page updates when Shopify confirms it."),
        onSettled: () => {
            void qc.invalidateQueries({ queryKey: key });
            // Prefix of queryKeys.admin.orders → every page / filter of this store's order list.
            void qc.invalidateQueries({ queryKey: queryKeys.admin.orders(tenant, {}).slice(0, 3) });
        },
    });
}
