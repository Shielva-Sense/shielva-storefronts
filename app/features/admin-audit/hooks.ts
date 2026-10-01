"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { ApiError } from "@/core/api-client";
import { queryKeys } from "@/core/query-keys";
import { fetchAudit } from "./api";
import type { AuditQuery, AuditResponse } from "./types";

export function useAuditLog(tenant: string, query: AuditQuery, enabled: boolean): UseQueryResult<AuditResponse, ApiError> {
    return useQuery<AuditResponse, ApiError>({
        queryKey: queryKeys.admin.audit(tenant, query.outcome ?? "all", query.limit),
        queryFn: () => fetchAudit(tenant, query),
        enabled,
        staleTime: 30_000,
    });
}
