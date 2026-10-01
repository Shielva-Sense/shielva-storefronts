"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ShieldCheck, ShieldOff } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, Select } from "@/components/ui/Field";
import { BrandSpinner } from "@/components/ui/ProgressOverlay";
import { StatSection } from "@/components/ui/StatSection";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Toolbar } from "@/components/ui/Toolbar";
import { ListLayout } from "@/components/layouts/ListLayout";
import { formatNumber, formatWhen } from "@/core/formatters";
import { useSearchParam } from "@/core/hooks";
import { useAdmin } from "@/features/admin-session/AdminContext";
import { LoadError } from "@/components/ui/Panel";
import { AUDIT_LIMIT, AUDIT_OUTCOMES, OUTCOME_TONES, SLOW_MS } from "@/features/admin-audit/constants";
import { useAuditLog } from "@/features/admin-audit/hooks";
import type { AuditEntry, AuditOutcome } from "@/features/admin-audit/types";
import styles from "./Audit.module.scss";

const COLUMNS: ColumnDef<AuditEntry, unknown>[] = [
    { id: "timestamp", header: "Timestamp", cell: ({ row }) => formatWhen(row.original.timestamp) },
    { id: "actor", header: "Actor", cell: ({ row }) => row.original.actor },
    { id: "auth", header: "Auth method", cell: ({ row }) => <span className={styles.mono}>{row.original.authMethod}</span> },
    { id: "action", header: "Action", cell: ({ row }) => row.original.action },
    { id: "resource", header: "Resource", cell: ({ row }) => row.original.resource },
    { id: "outcome", header: "Outcome", cell: ({ row }) => <StatusBadge tone={OUTCOME_TONES[row.original.outcome]}>{row.original.outcome}</StatusBadge> },
    {
        id: "path",
        header: "Request",
        cell: ({ row }) => (
            <span className={`${styles.mono} ${styles.path}`} title={row.original.path}>
                {row.original.method} {row.original.path}
            </span>
        ),
    },
    { id: "duration", header: "Duration", cell: ({ row }) => <span className={row.original.durationMs >= SLOW_MS ? styles.slow : styles.num}>{formatNumber(row.original.durationMs)} ms</span> },
    { id: "remote", header: "Remote addr", cell: ({ row }) => <span className={styles.mono}>{row.original.remoteAddr}</span> },
    {
        id: "hmac",
        header: "HMAC",
        cell: ({ row }) => (row.original.hmac ? <StatusBadge tone="success">Signed</StatusBadge> : <StatusBadge tone="warning">Unsigned</StatusBadge>),
    },
];

export function AuditClient(): React.JSX.Element {
    const { tenant, can } = useAdmin();
    const isOwner = can("owner");
    const [outcomeRaw, setOutcome] = useSearchParam("outcome");
    const outcome: AuditOutcome | "" = AUDIT_OUTCOMES.find((o) => o.value === outcomeRaw)?.value ?? "";
    const audit = useAuditLog(tenant, { outcome, limit: AUDIT_LIMIT }, isOwner);
    const items = audit.data?.items ?? [];

    if (!isOwner) {
        return (
            <ListLayout title="Audit log" subtitle="A tamper-evident record of every authenticated admin request.">
                <EmptyState
                    icon={<ShieldOff size={32} aria-hidden="true" />}
                    title="Only store owners can read the audit log"
                    description="The audit log records who did what, when and from where — including denied attempts — so access is limited to owners. Ask a store owner if you need an entry reviewed."
                />
            </ListLayout>
        );
    }

    const denied = items.filter((e) => e.outcome === "Denied").length;
    const failures = items.filter((e) => e.outcome === "Failure").length;
    const actors = new Set(items.map((e) => e.actor)).size;
    const unsigned = items.filter((e) => !e.hmac).length;

    return (
        <ListLayout
            title="Audit log"
            subtitle={`Every authenticated admin request for this storefront — newest ${AUDIT_LIMIT}. Entries are HMAC-signed so tampering is detectable, and kept for the retention window.`}
            stats={
                <StatSection
                    show={audit.isSuccess && items.length > 0}
                    stats={[
                        { label: "Entries shown", value: formatNumber(items.length), hint: outcome ? `${outcome} only` : "All outcomes" },
                        { label: "Denied", value: formatNumber(denied), tone: denied > 0 ? "warning" : "neutral", hint: "Blocked by role or policy" },
                        { label: "Failures", value: formatNumber(failures), tone: failures > 0 ? "danger" : "neutral", hint: "Server-side errors" },
                        { label: "Distinct actors", value: formatNumber(actors), hint: unsigned > 0 ? `${formatNumber(unsigned)} unsigned entries` : "All entries signed", tone: unsigned > 0 ? "warning" : "success" },
                    ]}
                />
            }
            toolbar={
                <Toolbar
                    label="Audit filters"
                    start={
                        <div className={styles.filter}>
                            <Field label="Outcome" hideLabel>
                                {(id) => (
                                    <Select id={id} value={outcome} onChange={(e) => setOutcome(e.target.value)}>
                                        {AUDIT_OUTCOMES.map((o) => <option key={o.value || "all"} value={o.value}>{o.label}</option>)}
                                    </Select>
                                )}
                            </Field>
                        </div>
                    }
                />
            }
        >
            {audit.isPending ? <BrandSpinner mode="content" message="Loading audit entries…" /> : null}
            {audit.isError ? <LoadError message={`Couldn't load the audit log: ${audit.error.message}`} onRetry={() => void audit.refetch()} /> : null}
            {audit.isSuccess && items.length === 0 ? (
                <EmptyState
                    icon={<ShieldCheck size={32} aria-hidden="true" />}
                    title={outcome ? `No ${outcome.toLowerCase()} entries` : "No audit entries yet"}
                    description="Each admin API request writes one entry with the actor, auth method, action, resource, outcome, caller IP and duration. Pick another outcome or come back after some admin activity."
                />
            ) : null}
            {items.length > 0 ? <DataTable columns={COLUMNS} data={items} getRowId={(e) => String(e.id)} caption="Audit log entries" /> : null}
        </ListLayout>
    );
}
