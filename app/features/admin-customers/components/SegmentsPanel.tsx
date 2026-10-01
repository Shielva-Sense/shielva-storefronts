"use client";

import { Download, Filter, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { confirmDialog } from "@/components/ui/ConfirmDialog";
import { BrandSpinner } from "@/components/ui/ProgressOverlay";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatNumber } from "@/core/formatters";
import { AdminPanel, LoadError, PanelNote } from "@/components/ui/Panel";
import { useDeleteSegment, useExportSegment, useSegments } from "../hooks";
import { describeRules } from "../rules";
import type { Segment } from "../types";
import styles from "./SegmentsPanel.module.scss";

interface SegmentsPanelProps {
    tenant: string;
    canEdit: boolean;
    activeId: string;
    onFilter: (id: string) => void;
    onCreate: () => void;
}

const isPending = (s: Segment): boolean => s.id.startsWith("pending-");

export function SegmentsPanel({ tenant, canEdit, activeId, onFilter, onCreate }: SegmentsPanelProps): React.JSX.Element {
    const segments = useSegments(tenant);
    const remove = useDeleteSegment(tenant);
    const exporter = useExportSegment(tenant);

    const onDelete = async (seg: Segment): Promise<void> => {
        const ok = await confirmDialog({
            title: `Delete "${seg.name}"?`,
            description: "Only the saved filter is removed — customers are not affected. Exports already downloaded are unchanged.",
            confirmLabel: "Delete segment",
            danger: true,
        });
        if (!ok) return;
        if (activeId === seg.id) onFilter("");
        remove.mutate(seg);
    };

    return (
        <AdminPanel
            id="segments"
            title="Segments"
            description="Saved customer filters with live counts. Use one to filter the list below or export it for a campaign."
            actions={
                <Button size="sm" leftIcon={<Users size={14} aria-hidden="true" />} onClick={onCreate} disabled={!canEdit}>
                    New segment
                </Button>
            }
        >
            {segments.isPending ? <BrandSpinner mode="content" message="Counting segment members…" /> : null}
            {segments.isError ? <LoadError message={`Couldn't load segments: ${segments.error.message}`} onRetry={() => void segments.refetch()} /> : null}
            {segments.data && segments.data.items.length === 0 ? (
                <PanelNote>No segments yet. Create one from rules like “2+ orders and spent over $300” to find your VIPs, or “no order for 90 days” for win-back.</PanelNote>
            ) : null}
            {segments.data && segments.data.items.length > 0 ? (
                <ul className={styles.list}>
                    {segments.data.items.map((s) => (
                        <li key={s.id} className={styles.row} data-active={activeId === s.id ? "true" : undefined}>
                            <div className={styles.info}>
                                <span className={styles.name}>{s.name}</span>
                                <span className={styles.rules}>{describeRules(s.rules)}</span>
                            </div>
                            <StatusBadge tone={activeId === s.id ? "info" : "neutral"} dot={false}>{formatNumber(s.count)} customers</StatusBadge>
                            <div className={styles.actions}>
                                <Button variant="ghost" size="sm" leftIcon={<Filter size={14} aria-hidden="true" />} disabled={isPending(s)} aria-pressed={activeId === s.id} onClick={() => onFilter(activeId === s.id ? "" : s.id)}>
                                    {activeId === s.id ? "Showing" : "Show"}
                                </Button>
                                <Button variant="ghost" size="sm" leftIcon={<Download size={14} aria-hidden="true" />} disabled={!canEdit || isPending(s) || exporter.isPending} onClick={() => exporter.mutate(s)}>
                                    Export CSV
                                </Button>
                                <Button variant="ghost" size="sm" leftIcon={<Trash2 size={14} aria-hidden="true" />} disabled={!canEdit || isPending(s)} onClick={() => void onDelete(s)} aria-label={`Delete segment ${s.name}`}>
                                    Delete
                                </Button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : null}
            {!canEdit ? <PanelNote>Viewers can filter by segments; creating, exporting and deleting needs the admin role.</PanelNote> : null}
        </AdminPanel>
    );
}
