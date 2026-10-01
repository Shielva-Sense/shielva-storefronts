"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ExternalLink, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { confirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable } from "@/components/ui/DataTable";
import { BrandSpinner, ProgressOverlay } from "@/components/ui/ProgressOverlay";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DetailLayout } from "@/components/layouts/ListLayout";
import { formatCents, formatNumber, formatWhen, humanize } from "@/core/formatters";
import { useAdmin } from "@/features/admin-session/AdminContext";
import { AdminPanel, LoadError, PanelNote } from "@/components/ui/Panel";
import { RefundModal } from "@/features/admin-orders/components/RefundModal";
import { financialTone, fulfillmentLabel, fulfillmentTone, REFUND_POLL, transactionTone } from "@/features/admin-orders/constants";
import { useOrder, useRefundOrder, type RefundPoll } from "@/features/admin-orders/hooks";
import type { OrderDetail, OrderLine, OrderTransaction, RefundInput } from "@/features/admin-orders/types";
import { RETURN_TONES } from "@/features/admin-postpurchase/constants";
import styles from "./OrderDetail.module.scss";

const LINE_COLUMNS: ColumnDef<OrderLine, unknown>[] = [
    {
        id: "item",
        header: "Item",
        cell: ({ row }) => (
            <span>
                <span className={styles.strong}>{row.original.title}</span>
                {row.original.variantTitle ? <span className={styles.muted}> · {row.original.variantTitle}</span> : null}
            </span>
        ),
    },
    { id: "sku", header: "SKU", cell: ({ row }) => <span className={styles.muted}>{row.original.sku ?? "—"}</span> },
    { id: "qty", header: "Qty", cell: ({ row }) => formatNumber(row.original.quantity) },
    { id: "price", header: "Price", cell: ({ row }) => <span className={styles.num}>{formatCents(row.original.priceCents)}</span> },
    { id: "total", header: "Line total", cell: ({ row }) => <span className={styles.num}>{formatCents(row.original.priceCents * row.original.quantity)}</span> },
];

const TXN_COLUMNS: ColumnDef<OrderTransaction, unknown>[] = [
    { id: "kind", header: "Kind", cell: ({ row }) => humanize(row.original.kind) },
    {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
            <StatusBadge tone={transactionTone(row.original.status)}>
                {humanize(row.original.status)}
                {row.original.errorCode ? ` · ${row.original.errorCode}` : ""}
            </StatusBadge>
        ),
    },
    { id: "gateway", header: "Gateway", cell: ({ row }) => humanize(row.original.gateway) },
    { id: "amount", header: "Amount", cell: ({ row }) => <span className={styles.num}>{formatCents(row.original.amountCents)}</span> },
    { id: "processed", header: "Processed at", cell: ({ row }) => formatWhen(row.original.processedAt) },
];

function Totals({ detail }: { detail: OrderDetail }): React.JSX.Element {
    const o = detail.order;
    const rows = [
        { label: "Subtotal", value: o.subtotalCents },
        { label: "Discounts", value: o.discountCents > 0 ? -o.discountCents : 0 },
        { label: "Shipping", value: o.shippingCents },
        { label: "Tax", value: o.taxCents },
    ];
    return (
        <dl className={styles.totals}>
            {rows.map((r) => (
                <div key={r.label} className={styles.totalRow}><dt>{r.label}</dt><dd>{formatCents(r.value)}</dd></div>
            ))}
            <div className={`${styles.totalRow} ${styles.grand}`}><dt>Total</dt><dd>{formatCents(o.totalCents)}</dd></div>
            <div className={styles.totalRow}><dt>Refunded</dt><dd>{formatCents(o.totalRefundedCents > 0 ? -o.totalRefundedCents : 0)}</dd></div>
            <div className={`${styles.totalRow} ${styles.grand}`}><dt>Net</dt><dd>{formatCents(o.totalCents - o.totalRefundedCents)}</dd></div>
        </dl>
    );
}

export function OrderDetailClient({ id }: { id: string }): React.JSX.Element {
    const { tenant, can } = useAdmin();
    const [poll, setPoll] = useState<RefundPoll | null>(null);
    const [refundOpen, setRefundOpen] = useState(false);
    const order = useOrder(tenant, id, poll);
    const refund = useRefundOrder(tenant, id);
    const storeQs = `?store=${encodeURIComponent(tenant)}`;

    // Stop the refund poll after its maximum window.
    useEffect(() => {
        if (!poll) return;
        const t = window.setTimeout(() => setPoll(null), Math.max(0, poll.until - Date.now()));
        return () => window.clearTimeout(t);
    }, [poll]);

    const breadcrumb = (
        <ol className={styles.crumbs}>
            <li><Link href={`/admin/orders${storeQs}`}>Orders</Link></li>
            <li aria-current="page">{order.data?.order.name ?? "Order"}</li>
        </ol>
    );

    if (order.isPending) {
        return (
            <DetailLayout breadcrumb={breadcrumb} title="Order">
                <BrandSpinner mode="content" message="Loading the order…" />
            </DetailLayout>
        );
    }
    if (order.isError) {
        return (
            <DetailLayout breadcrumb={breadcrumb} title="Order">
                <LoadError message={order.error.status === 404 ? "This order doesn't exist in this storefront." : `Couldn't load the order: ${order.error.message}`} onRetry={() => void order.refetch()} />
            </DetailLayout>
        );
    }

    const detail = order.data;
    const o = detail.order;
    const cancelled = o.cancelledAt !== null;
    const refundableCents = Math.max(0, o.totalCents - o.totalRefundedCents);
    const canRefund = can("admin") && refundableCents > 0 && !cancelled;
    const awaitingWebhook = poll !== null && o.totalRefundedCents === poll.baselineRefundedCents;

    const submitRefund = async (input: RefundInput): Promise<void> => {
        setRefundOpen(false);
        const ok = await confirmDialog({
            title: `Refund ${formatCents(input.amountCents)}?`,
            description: `Shopify Payments will return ${formatCents(input.amountCents)} to the customer for ${o.name}. This cannot be undone.`,
            confirmLabel: "Refund now",
            danger: true,
        });
        if (!ok) {
            setRefundOpen(true);
            return;
        }
        refund.mutate(input, {
            onSuccess: () => setPoll({ until: Date.now() + REFUND_POLL.maxMs, baselineRefundedCents: o.totalRefundedCents }),
            onError: () => setRefundOpen(true),
        });
    };

    return (
        <DetailLayout
            breadcrumb={breadcrumb}
            title={`Order ${o.name}`}
            subtitle={
                <span className={styles.meta}>
                    <StatusBadge tone={financialTone(o.financialStatus)}>{humanize(o.financialStatus)}</StatusBadge>
                    <StatusBadge tone={fulfillmentTone(o.fulfillmentStatus, cancelled)}>{fulfillmentLabel(o.fulfillmentStatus, cancelled)}</StatusBadge>
                    <span>Placed {formatWhen(o.shopifyCreatedAt)}</span>
                    {o.email ? (
                        <span>
                            · <Link className={styles.link} href={`/admin/customers/${encodeURIComponent(o.email.toLowerCase())}${storeQs}`}>{o.customerName ?? o.email}</Link>
                        </span>
                    ) : null}
                </span>
            }
            headerActions={
                <>
                    <Button variant="danger" leftIcon={<Undo2 size={14} aria-hidden="true" />} disabled={!canRefund || refund.isPending} onClick={() => setRefundOpen(true)}>
                        Issue refund
                    </Button>
                    {!can("admin") ? <p className={styles.viewerNote}>Viewers can&apos;t issue refunds — ask a store admin.</p> : null}
                </>
            }
        >
            {awaitingWebhook ? (
                <p className={styles.pendingNote} role="status">Refund sent to Shopify. Waiting for Shopify&apos;s webhook to confirm it — this page refreshes every few seconds.</p>
            ) : null}

            <div className={styles.grid}>
                <div className={styles.stack}>
                    <AdminPanel id="lines" title="Line items">
                        {detail.lines.length > 0 ? <DataTable columns={LINE_COLUMNS} data={detail.lines} getRowId={(l) => l.id} caption="Line items" /> : <PanelNote>This order has no line items.</PanelNote>}
                    </AdminPanel>

                    <AdminPanel id="transactions" title="Transactions" description="Payment events reported by Shopify — sales, captures and refunds.">
                        {detail.transactions.length > 0 ? (
                            <DataTable columns={TXN_COLUMNS} data={detail.transactions} getRowId={(t) => t.id} caption="Payment transactions" />
                        ) : (
                            <PanelNote>No payment transactions recorded yet.</PanelNote>
                        )}
                    </AdminPanel>

                    <AdminPanel id="refunds" title="Refunds">
                        {detail.refunds.length > 0 ? (
                            <ul className={styles.list}>
                                {detail.refunds.map((r) => (
                                    <li key={r.id} className={styles.item}>
                                        <div className={styles.itemHead}>
                                            <span className={styles.strong}>{formatCents(r.amountCents)}</span>
                                            <span className={styles.muted}>{formatWhen(r.processedAt)}</span>
                                        </div>
                                        {r.note ? <span>{r.note}</span> : null}
                                        {r.lines.length > 0 ? (
                                            <span className={styles.muted}>{r.lines.map((l) => `${l.quantity} × ${l.sku ?? "item"}`).join(", ")}</span>
                                        ) : null}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <PanelNote>No refunds. Refunds issued here or in Shopify appear once Shopify&apos;s webhook confirms them.</PanelNote>
                        )}
                    </AdminPanel>

                    <AdminPanel id="shipments" title="Shipments">
                        {detail.shipments.length > 0 ? (
                            <ul className={styles.list}>
                                {detail.shipments.map((s) => (
                                    <li key={s.id} className={styles.item}>
                                        <div className={styles.itemHead}>
                                            <StatusBadge tone={s.status === "success" ? "success" : "info"}>{humanize(s.status)}</StatusBadge>
                                            <span className={styles.muted}>{formatWhen(s.createdAtShopify)}</span>
                                        </div>
                                        <span>
                                            {s.trackingCompany ?? "Carrier not set"}
                                            {s.trackingNumber ? ` · ${s.trackingNumber}` : ""}
                                        </span>
                                        {s.trackingUrl ? (
                                            <a href={s.trackingUrl} target="_blank" rel="noopener noreferrer" className={styles.link}>
                                                Track shipment <ExternalLink size={13} aria-hidden="true" /><span className="visually-hidden"> (opens in a new tab)</span>
                                            </a>
                                        ) : null}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <PanelNote>{cancelled ? "This order was cancelled." : "Not shipped yet. Fulfilments created in Shopify appear here with tracking."}</PanelNote>
                        )}
                    </AdminPanel>

                    <AdminPanel id="returns" title="Returns & exchanges">
                        {detail.returns.length > 0 ? (
                            <ul className={styles.list}>
                                {detail.returns.map((r) => (
                                    <li key={r.id} className={styles.item}>
                                        <div className={styles.itemHead}>
                                            <span className={styles.strong}>{humanize(r.type)}</span>
                                            <StatusBadge tone={RETURN_TONES[r.status]}>{humanize(r.status)}</StatusBadge>
                                        </div>
                                        <span>{r.reason}</span>
                                        <span className={styles.muted}>{r.lines.map((l) => `${l.quantity} × ${l.sku}${l.exchangeSku ? ` → ${l.exchangeSku}` : ""}`).join(", ")}</span>
                                        <Link className={styles.link} href={`/admin/returns${storeQs}&status=${r.status}`}>Manage in Returns</Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <PanelNote>No return or exchange requests for this order.</PanelNote>
                        )}
                    </AdminPanel>
                </div>

                <div className={styles.stack}>
                    <AdminPanel id="summary" title="Summary">
                        <Totals detail={detail} />
                    </AdminPanel>
                    <AdminPanel id="timeline" title="Timeline">
                        {detail.timeline.length > 0 ? (
                            <ol className={styles.timeline}>
                                {detail.timeline.map((e) => (
                                    <li key={e.id} className={styles.event}>
                                        <span>{e.message}</span>
                                        <span className={styles.eventMeta}>{formatWhen(e.occurredAt)} · {humanize(e.source)}</span>
                                    </li>
                                ))}
                            </ol>
                        ) : (
                            <PanelNote>No events recorded yet.</PanelNote>
                        )}
                    </AdminPanel>
                </div>
            </div>

            <RefundModal
                key={o.totalRefundedCents}
                open={refundOpen}
                detail={detail}
                pending={refund.isPending}
                onClose={() => setRefundOpen(false)}
                onSubmit={(input) => void submitRefund(input)}
            />
            <ProgressOverlay open={refund.isPending} message="Sending the refund to Shopify…" detail="Shopify Payments moves the money; we update when its webhook confirms." />
        </DetailLayout>
    );
}
