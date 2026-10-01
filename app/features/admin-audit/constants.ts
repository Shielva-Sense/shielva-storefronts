import type { Tone } from "@/components/ui/StatusBadge";
import type { AuditOutcome } from "./types";

export const AUDIT_OUTCOMES = [
    { value: "", label: "All outcomes" },
    { value: "Success", label: "Success" },
    { value: "Denied", label: "Denied" },
    { value: "Failure", label: "Failure" },
] as const satisfies readonly { value: AuditOutcome | ""; label: string }[];

export const OUTCOME_TONES: Record<AuditOutcome, Tone> = { Success: "success", Denied: "warning", Failure: "danger" };

/** Rows fetched per view (API max 500). */
export const AUDIT_LIMIT = 200;

/** Requests slower than this are highlighted. */
export const SLOW_MS = 1_000;
