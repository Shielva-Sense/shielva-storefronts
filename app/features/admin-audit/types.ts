export type AuditOutcome = "Success" | "Denied" | "Failure";

export interface AuditEntry {
    id: number;
    requestId: string;
    timestamp: string;
    tenantId: string | null;
    actor: string;
    authMethod: string;
    method: string;
    path: string;
    action: string;
    resource: string;
    outcome: AuditOutcome;
    remoteAddr: string;
    durationMs: number;
    hmac: string | null;
}

export interface AuditResponse {
    items: AuditEntry[];
}

export interface AuditQuery {
    outcome: AuditOutcome | "";
    limit: number;
}
