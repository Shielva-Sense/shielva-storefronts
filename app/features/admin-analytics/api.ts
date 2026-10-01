import { apiFetch } from "@/core/api-client";
import type { AnalyticsSummary, CompareResponse, ExperimentsResponse } from "./types";

export type { AnalyticsSummary, CompareResponse, CompareRow, Experiment, ExperimentArm, ExperimentsResponse, Funnel, Kpis, SeriesPoint, TopProduct } from "./types";

export async function fetchAnalyticsSummary(tenant: string, days: number): Promise<AnalyticsSummary> {
    return apiFetch<AnalyticsSummary>(`/admin/analytics/summary?days=${days}`, { tenant });
}

/** Cross-storefront comparison — scoped server-side to the stores this admin belongs to. */
export async function fetchStoreComparison(tenant: string, days: number): Promise<CompareResponse> {
    return apiFetch<CompareResponse>(`/admin/analytics/compare?days=${days}`, { tenant });
}

export async function fetchExperiments(tenant: string, days: number): Promise<ExperimentsResponse> {
    return apiFetch<ExperimentsResponse>(`/admin/analytics/experiments?days=${days}`, { tenant });
}
