"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { PackageX } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { confirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { BrandSpinner } from "@/components/ui/ProgressOverlay";
import { StatSection } from "@/components/ui/StatSection";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TabNav } from "@/components/ui/TabNav";
import { ListLayout } from "@/components/layouts/ListLayout";
import { formatNumber, formatWhen, humanize } from "@/core/formatters";
import { useSearchParam } from "@/core/hooks";
import { useAdmin } from "@/features/admin-session/AdminContext";
import { LoadError, PanelNote } from "@/components/ui/Panel";
import { RETURN_TABS, RETURN_TONES, returnActions, type ReturnAction, type ReturnTab } from "@/features/admin-postpurchase/constants";
import { useReturns, useTransitionReturn } from "@/features/admin-postpurchase/hooks";
import type { ReturnRecord } from "@/features/admin-postpurchase/types";
import styles from "./Returns.module.scss";

const TAB_PREFIX = "returns-status";
const NOTE_FORM_ID = "return-note-form";
const NOTE_MAX = 500;

interface PendingAction {
    ret: ReturnRecord;
    action: ReturnAction;
}

function buildColumns(storeQs: string, canEdit: boolean, onAction: (ret: ReturnRecord, action: ReturnAction) => void): ColumnDef<ReturnRecord, unknown>[] {
    return [
        { id: "order", header: "Order", cell: ({ row }) => <Link className={styles.link} href={`/admin/orders/${row.original.shopifyOrderId}${storeQs}`}>{row.original.orderName}</Link> },
        {
            id: "customer",
            header: "Customer",
            cell: ({ row }) => <Link className={styles.link} href={`/admin/customers/${encodeURIComponent(row.original.customerEmail)}${storeQs}`}>{row.original.customerEmail}</Link>,
        },
        { id: "type", header: "Type", cell: ({ row }) => <StatusBadge tone={row.original.type === "return" ? "neutral" : "info"} dot={false}>{humanize(row.original.type)}</StatusBadge> },
        {
            id: "reason",
            header: "Reason",
            cell: ({ row }) => (
                <span className={styles.reason}>
                    {row.original.reason}
                    {row.original.adminNote ? <span className={styles.muted}><br />Note: {row.original.adminNote}</span> : null}
                </span>
            ),
        },
        {
            id: "lines",
            header: "Lines",
            cell: ({ row }) => (
                <ul className={styles.lines}>
                    {row.original.lines.map((l) => (
                        <li key={`${l.sku}-${l.exchangeSku ?? ""}`}>{l.quantity} × {l.sku}{l.exchangeSku ? ` → ${l.exchangeSku}` : ""}</li>
                    ))}
                </ul>
            ),
        },
        { id: "status", header: "Status", cell: ({ row }) => <StatusBadge tone={RETURN_TONES[row.original.status]}>{humanize(row.original.status)}</StatusBadge> },
        { id: "created", header: "Requested", cell: ({ row }) => <span className={styles.muted}>{formatWhen(row.original.createdAt)}</span> },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const actions = returnActions(row.original);
                if (actions.length === 0) return <span className={styles.muted}>Closed</span>;
                return (
                    <span className={styles.actions}>
                        {actions.map((a) => (
                            <Button key={a.to} size="sm" variant={a.danger ? "danger" : "secondary"} disabled={!canEdit} onClick={() => onAction(row.original, a)}>
                                {a.label}
                            </Button>
                        ))}
                    </span>
                );
            },
        },
    ];
}

export function ReturnsClient(): React.JSX.Element {
    const { tenant, can } = useAdmin();
    const canEdit = can("admin");
    const [statusRaw, setStatus] = useSearchParam("status", "requested");
    const status: ReturnTab = RETURN_TABS.find((t) => t.id === statusRaw)?.id ?? "requested";
    const returns = useReturns(tenant, status);
    const transition = useTransitionReturn(tenant, status);
    const [pending, setPending] = useState<PendingAction | null>(null);
    const [note, setNote] = useState("");

    const items = returns.data?.items ?? [];
    const storeQs = `?store=${encodeURIComponent(tenant)}`;

    const openAction = (ret: ReturnRecord, action: ReturnAction): void => {
        setNote("");
        setPending({ ret, action });
    };

    const submit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        if (!pending) return;
        const { ret, action } = pending;
        setPending(null);
        if (action.danger) {
            const ok = await confirmDialog({
                title: `${action.label} ${ret.type} for ${ret.orderName}?`,
                description: action.description,
                confirmLabel: action.label,
                danger: true,
            });
            if (!ok) return;
        }
        const trimmed = note.trim();
        transition.mutate({ id: ret.id, to: action.to, ...(trimmed ? { note: trimmed } : {}) });
    };

    const exchanges = items.filter((r) => r.type === "exchange").length;
    const units = items.reduce((n, r) => n + r.lines.reduce((m, l) => m + l.quantity, 0), 0);

    return (
        <ListLayout
            title="Returns & exchanges"
            subtitle="Flow: requested → approve (customer ships back) → received → refund (returns, via Shopify) or mark exchanged (replacement fulfilled in Shopify). Rejections email the customer your note."
            stats={
                <StatSection
                    show={returns.isSuccess && items.length > 0}
                    stats={[
                        { label: status === "all" ? "Requests" : `${humanize(status)}`, value: formatNumber(items.length), hint: "Most recent 200" },
                        { label: "Returns", value: formatNumber(items.length - exchanges), hint: "Refund on receipt" },
                        { label: "Exchanges", value: formatNumber(exchanges), hint: "Replacement on receipt" },
                        { label: "Units", value: formatNumber(units), hint: "Across these requests" },
                    ]}
                />
            }
            tabs={<TabNav label="Return status" idPrefix={TAB_PREFIX} tabs={RETURN_TABS} active={status} onChange={setStatus} />}
            aboveContent={!canEdit ? <PanelNote>You have view-only access — approving, receiving and refunding returns needs the admin role.</PanelNote> : null}
        >
            <div role="tabpanel" id={`${TAB_PREFIX}-panel`} aria-labelledby={`${TAB_PREFIX}-tab-${status}`}>
                {returns.isPending ? <BrandSpinner mode="content" message="Loading return requests…" /> : null}
                {returns.isError ? <LoadError message={`Couldn't load returns: ${returns.error.message}`} onRetry={() => void returns.refetch()} /> : null}
                {returns.isSuccess && items.length === 0 ? (
                    <EmptyState
                        icon={<PackageX size={32} aria-hidden="true" />}
                        title={status === "all" ? "No return requests yet" : `Nothing ${humanize(status).toLowerCase()}`}
                        description="Customers request returns or exchanges from their account page on a delivered order. New requests land in “Requested” for you to approve or reject."
                    />
                ) : null}
                {items.length > 0 ? <DataTable columns={buildColumns(storeQs, canEdit, openAction)} data={items} getRowId={(r) => r.id} caption="Return and exchange requests" /> : null}
            </div>

            <Modal
                open={pending !== null}
                onClose={() => setPending(null)}
                title={pending ? `${pending.action.label} · ${pending.ret.orderName}` : "Update return"}
                description={pending?.action.description ?? ""}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setPending(null)}>Cancel</Button>
                        <Button type="submit" form={NOTE_FORM_ID} variant={pending?.action.danger ? "danger" : "primary"} disabled={transition.isPending}>
                            {pending?.action.label ?? "Continue"}
                        </Button>
                    </>
                }
            >
                <form id={NOTE_FORM_ID} className={styles.form} onSubmit={(e) => void submit(e)}>
                    <Field label="Note (optional)" help={`${note.length}/${NOTE_MAX} — saved on the return and the order timeline${pending?.action.to === "rejected" ? ", and included in the customer's email" : ""}.`}>
                        {(id, describedBy) => <Textarea id={id} rows={3} maxLength={NOTE_MAX} value={note} onChange={(e) => setNote(e.target.value)} aria-describedby={describedBy} />}
                    </Field>
                </form>
            </Modal>
        </ListLayout>
    );
}
