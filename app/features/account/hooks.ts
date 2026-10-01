"use client";

import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { toast } from "@/components/ui/Toast";
import type { ApiError } from "@/core/api-client";
import { queryKeys } from "@/core/query-keys";
import type { StoreSlug } from "../storefront/types";
import {
    cancelBooking,
    fetchBookings,
    fetchMe,
    fetchOrders,
    fetchSession,
    logout,
    requestCode,
    requestReturn,
    submitReview,
    verifyCode,
    type AccountBooking,
    type AccountMe,
    type AccountOrder,
    type ReturnRequest,
    type ReviewInput,
} from "./api";

export function useCustomerSession(store: StoreSlug): UseQueryResult<string | null, ApiError> {
    return useQuery<string | null, ApiError>({ queryKey: queryKeys.store.session(store), queryFn: () => fetchSession(store) });
}

export function useAccountMe(store: StoreSlug, enabled = true): UseQueryResult<AccountMe, ApiError> {
    return useQuery<AccountMe, ApiError>({ queryKey: queryKeys.store.me(store), queryFn: () => fetchMe(store), retry: false, enabled });
}

/** `placed` = order name from the checkout redirect; polls (5 s) until Shopify's paid webhook has landed. */
export function useAccountOrders(store: StoreSlug, placed: string | null): UseQueryResult<AccountOrder[], ApiError> {
    return useQuery<AccountOrder[], ApiError>({
        queryKey: queryKeys.store.orders(store),
        queryFn: () => fetchOrders(store),
        refetchInterval: (query) => {
            if (!placed) return false;
            const order = query.state.data?.find((o) => o.name === placed);
            return !order || order.financialStatus === "pending" ? 5000 : false;
        },
    });
}

export function useAccountBookings(store: StoreSlug, enabled: boolean): UseQueryResult<AccountBooking[], ApiError> {
    return useQuery<AccountBooking[], ApiError>({ queryKey: queryKeys.store.bookings(store), queryFn: () => fetchBookings(store), enabled });
}

export function useRequestCode(store: StoreSlug) {
    return useMutation({
        mutationFn: (email: string) => requestCode(store, email),
        onError: (err: Error) => toast.error(err.message),
    });
}

export function useVerifyCode(store: StoreSlug, onSignedIn: () => Promise<void>) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ email, code }: { email: string; code: string }) => verifyCode(store, email, code),
        onSuccess: async () => {
            await onSignedIn();
        },
        onError: (err: Error) => toast.error(err.message),
        onSettled: () => qc.invalidateQueries({ queryKey: ["store", store] }),
    });
}

export function useLogout(store: StoreSlug) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => logout(store),
        onMutate: async () => {
            await qc.cancelQueries({ queryKey: ["store", store] });
            const prev = qc.getQueryData<AccountMe>(queryKeys.store.me(store));
            qc.removeQueries({ queryKey: queryKeys.store.orders(store) });
            return { prev };
        },
        onError: (err: Error, _v, ctx) => {
            if (ctx?.prev) qc.setQueryData<AccountMe>(queryKeys.store.me(store), ctx.prev);
            toast.error(err.message);
        },
        onSettled: () => qc.resetQueries({ queryKey: ["store", store] }),
    });
}

export function useCancelBooking(store: StoreSlug) {
    const qc = useQueryClient();
    const key = queryKeys.store.bookings(store);
    return useMutation({
        mutationFn: (id: string) => cancelBooking(store, id),
        onMutate: async (id) => {
            await qc.cancelQueries({ queryKey: key });
            const prev = qc.getQueryData<AccountBooking[]>(key);
            qc.setQueryData<AccountBooking[]>(key, (old) => old?.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)));
            return { prev };
        },
        onError: (err: Error, _id, ctx) => {
            if (ctx?.prev) qc.setQueryData<AccountBooking[]>(key, ctx.prev);
            toast.error(err.message);
        },
        onSuccess: () => toast.success("Appointment cancelled"),
        onSettled: () => qc.invalidateQueries({ queryKey: key }),
    });
}

export function useRequestReturn(store: StoreSlug) {
    const qc = useQueryClient();
    const key = queryKeys.store.orders(store);
    return useMutation({
        mutationFn: (body: ReturnRequest) => requestReturn(store, body),
        onMutate: async (body) => {
            await qc.cancelQueries({ queryKey: key });
            const prev = qc.getQueryData<AccountOrder[]>(key);
            qc.setQueryData<AccountOrder[]>(key, (old) =>
                old?.map((o) =>
                    o.id === body.orderId
                        ? { ...o, returns: [...o.returns, { id: `pending-${Date.now()}`, type: body.type, status: "requested", reason: body.reason, lines: body.lines, createdAt: new Date().toISOString() }] }
                        : o,
                ),
            );
            return { prev };
        },
        onError: (err: Error, _b, ctx) => {
            if (ctx?.prev) qc.setQueryData<AccountOrder[]>(key, ctx.prev);
            toast.error(err.message);
        },
        onSuccess: () => toast.success("Request received — we'll email you once it's reviewed."),
        onSettled: () => qc.invalidateQueries({ queryKey: key }),
    });
}

export function useSubmitReview(store: StoreSlug) {
    const qc = useQueryClient();
    const key = queryKeys.store.orders(store);
    return useMutation({
        mutationFn: (body: ReviewInput) => submitReview(store, body),
        onMutate: async (body) => {
            await qc.cancelQueries({ queryKey: key });
            const prev = qc.getQueryData<AccountOrder[]>(key);
            qc.setQueryData<AccountOrder[]>(key, (old) => old?.map((o) => ({ ...o, lines: o.lines.map((l) => (l.sku === body.sku ? { ...l, reviewed: true } : l)) })));
            return { prev };
        },
        onError: (err: Error, _b, ctx) => {
            if (ctx?.prev) qc.setQueryData<AccountOrder[]>(key, ctx.prev);
            toast.error(err.message);
        },
        onSuccess: () => toast.success("Thanks! Your review will appear once it's approved."),
        onSettled: () => qc.invalidateQueries({ queryKey: key }),
    });
}
