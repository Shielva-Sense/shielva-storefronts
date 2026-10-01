import { apiFetch } from "@/core/api-client";
import type { ModerateInput, ReturnsResponse, ReturnTransitionInput, ReviewsResponse } from "./types";

export type { AdminReview, ModerateInput, ReturnRecord, ReturnsResponse, ReturnStatus, ReturnTarget, ReturnTransitionInput, ReviewsResponse, ReviewStatus } from "./types";

export async function fetchReturns(tenant: string, status: string): Promise<ReturnsResponse> {
    return apiFetch<ReturnsResponse>(`/admin/returns?status=${encodeURIComponent(status)}`, { tenant });
}

export async function transitionReturn(tenant: string, input: ReturnTransitionInput): Promise<{ ok: boolean }> {
    return apiFetch<{ ok: boolean }>(`/admin/returns/${encodeURIComponent(input.id)}/transition`, {
        method: "POST",
        tenant,
        body: { to: input.to, ...(input.note ? { note: input.note } : {}) },
    });
}

export async function fetchReviews(tenant: string, status: string): Promise<ReviewsResponse> {
    return apiFetch<ReviewsResponse>(`/admin/reviews?status=${encodeURIComponent(status)}`, { tenant });
}

export async function moderateReview(tenant: string, input: ModerateInput): Promise<{ ok: boolean }> {
    return apiFetch<{ ok: boolean }>(`/admin/reviews/${encodeURIComponent(input.id)}/moderate`, { method: "POST", tenant, body: { status: input.status } });
}
