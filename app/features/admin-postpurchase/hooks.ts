"use client";

import { useMutation, useQuery, useQueryClient, type UseMutationResult, type UseQueryResult } from "@tanstack/react-query";
import { toast } from "@/components/ui/Toast";
import type { ApiError } from "@/core/api-client";
import { queryKeys } from "@/core/query-keys";
import { fetchReturns, fetchReviews, moderateReview, transitionReturn } from "./api";
import type { ModerateInput, ReturnsResponse, ReturnTransitionInput, ReviewsResponse } from "./types";

export function useReturns(tenant: string, status: string): UseQueryResult<ReturnsResponse, ApiError> {
    return useQuery<ReturnsResponse, ApiError>({ queryKey: queryKeys.admin.returns(tenant, status), queryFn: () => fetchReturns(tenant, status) });
}

interface ListContext<T> {
    prev: T | undefined;
}

/** Optimistic: the row moves to its new status (and leaves a filtered tab). Refunds wait for Shopify's webhook. */
export function useTransitionReturn(tenant: string, status: string): UseMutationResult<{ ok: boolean }, ApiError, ReturnTransitionInput, ListContext<ReturnsResponse>> {
    const qc = useQueryClient();
    const key = queryKeys.admin.returns(tenant, status);
    return useMutation<{ ok: boolean }, ApiError, ReturnTransitionInput, ListContext<ReturnsResponse>>({
        mutationFn: (input) => transitionReturn(tenant, input),
        onMutate: async (input) => {
            await qc.cancelQueries({ queryKey: key });
            const prev = qc.getQueryData<ReturnsResponse>(key);
            if (input.to !== "refunded") {
                qc.setQueryData<ReturnsResponse>(key, (old) =>
                    old
                        ? {
                              items: old.items
                                  .map((r) => (r.id === input.id ? { ...r, status: input.to, adminNote: input.note ?? r.adminNote } : r))
                                  .filter((r) => status === "all" || r.status === status),
                          }
                        : old,
                );
            }
            return { prev };
        },
        onError: (err, _input, ctx) => {
            if (ctx?.prev) qc.setQueryData<ReturnsResponse>(key, ctx.prev);
            toast.error(`Couldn't update the return: ${err.message}`);
        },
        onSuccess: (_res, input) => toast.success(input.to === "refunded" ? "Refund sent to Shopify — the return flips to refunded when Shopify confirms." : `Return ${input.to}.`),
        onSettled: () => {
            // Prefix of queryKeys.admin.returns → every status tab.
            void qc.invalidateQueries({ queryKey: queryKeys.admin.returns(tenant, "").slice(0, 3) });
        },
    });
}

export function useReviews(tenant: string, status: string): UseQueryResult<ReviewsResponse, ApiError> {
    return useQuery<ReviewsResponse, ApiError>({ queryKey: queryKeys.admin.reviews(tenant, status), queryFn: () => fetchReviews(tenant, status) });
}

/** Optimistic: a moderated review leaves the pending list immediately (or changes status on "all"). */
export function useModerateReview(tenant: string, status: string): UseMutationResult<{ ok: boolean }, ApiError, ModerateInput, ListContext<ReviewsResponse>> {
    const qc = useQueryClient();
    const key = queryKeys.admin.reviews(tenant, status);
    return useMutation<{ ok: boolean }, ApiError, ModerateInput, ListContext<ReviewsResponse>>({
        mutationFn: (input) => moderateReview(tenant, input),
        onMutate: async (input) => {
            await qc.cancelQueries({ queryKey: key });
            const prev = qc.getQueryData<ReviewsResponse>(key);
            qc.setQueryData<ReviewsResponse>(key, (old) =>
                old
                    ? {
                          items: old.items
                              .map((r) => (r.id === input.id ? { ...r, status: input.status } : r))
                              .filter((r) => status === "all" || r.status === status),
                      }
                    : old,
            );
            return { prev };
        },
        onError: (err, _input, ctx) => {
            if (ctx?.prev) qc.setQueryData<ReviewsResponse>(key, ctx.prev);
            toast.error(`Couldn't moderate the review: ${err.message}`);
        },
        onSuccess: (_res, input) => toast.success(input.status === "approved" ? "Review published on the storefront." : "Review rejected."),
        onSettled: () => {
            void qc.invalidateQueries({ queryKey: queryKeys.admin.reviews(tenant, "").slice(0, 3) });
        },
    });
}
