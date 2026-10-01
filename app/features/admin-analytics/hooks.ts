"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { ApiError } from "@/core/api-client";
import { queryKeys } from "@/core/query-keys";
import { fetchAnalyticsSummary, fetchExperiments, fetchStoreComparison } from "./api";
import type { AnalyticsSummary, CompareResponse, ExperimentsResponse } from "./types";

export function useAnalyticsSummary(tenant: string, days: number): UseQueryResult<AnalyticsSummary, ApiError> {
    return useQuery<AnalyticsSummary, ApiError>({ queryKey: queryKeys.admin.summary(tenant, days), queryFn: () => fetchAnalyticsSummary(tenant, days) });
}

export function useStoreComparison(tenant: string, days: number): UseQueryResult<CompareResponse, ApiError> {
    return useQuery<CompareResponse, ApiError>({ queryKey: queryKeys.admin.compare(days), queryFn: () => fetchStoreComparison(tenant, days) });
}

export function useExperiments(tenant: string, days: number): UseQueryResult<ExperimentsResponse, ApiError> {
    return useQuery<ExperimentsResponse, ApiError>({ queryKey: queryKeys.admin.experiments(tenant, days), queryFn: () => fetchExperiments(tenant, days) });
}
