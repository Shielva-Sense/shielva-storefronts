import { apiFetch } from "@/core/api-client";
import type { AuditQuery, AuditResponse } from "./types";

export type { AuditEntry, AuditOutcome, AuditQuery, AuditResponse } from "./types";

/** Owner-only: the API rejects admins and viewers with 403. */
export async function fetchAudit(tenant: string, query: AuditQuery): Promise<AuditResponse> {
    const qs = new URLSearchParams({ limit: String(query.limit) });
    if (query.outcome) qs.set("outcome", query.outcome);
    return apiFetch<AuditResponse>(`/admin/audit?${qs.toString()}`, { tenant });
}
