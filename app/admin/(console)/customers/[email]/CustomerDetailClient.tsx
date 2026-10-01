"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Field, Input } from "@/components/ui/Field";
import { BrandSpinner } from "@/components/ui/ProgressOverlay";
import { StarRating } from "@/components/ui/StarRating";
import { StatSection } from "@/components/ui/StatSection";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DetailLayout } from "@/components/layouts/ListLayout";
import { formatCents, formatNumber, formatShortDay, formatWhen, humanize } from "@/core/formatters";
import { useAdmin } from "@/features/admin-session/AdminContext";
import { AdminPanel, LoadError, PanelNote } from "@/components/ui/Panel";
import { BOOKING_TONES, TAG_MAX_LENGTH, TAGS_MAX } from "@/features/admin-customers/constants";
import { useCustomer, useUpdateCustomerTags } from "@/features/admin-customers/hooks";
import type { CustomerDetail, CustomerOrder } from "@/features/admin-customers/types";
import { financialTone, fulfillmentLabel, fulfillmentTone } from "@/features/admin-orders/constants";
import { REVIEW_TONES } from "@/features/admin-postpurchase/constants";
import styles from "./CustomerDetail.module.scss";

function orderColumns(storeQs: string): ColumnDef<CustomerOrder, unknown>[] {
    return [
        { id: "name", header: "Order", cell: ({ row }) => <Link className={styles.link} href={`/admin/orders/${row.original.id}${storeQs}`}>{row.original.name}</Link> },
        { id: "payment", header: "Payment", cell: ({ row }) => <StatusBadge tone={financialTone(row.original.financialStatus)}>{humanize(row.original.financialStatus)}</StatusBadge> },
        { id: "fulfillment", header: "Fulfillment", cell: ({ row }) => <StatusBadge tone={fulfillmentTone(row.original.fulfillmentStatus, false)}>{fulfillmentLabel(row.original.fulfillmentStatus, false)}</StatusBadge> },
        { id: "total", header: "Total", cell: ({ row }) => <span className={styles.num}>{formatCents(row.original.totalCents)}</span> },
        { id: "date", header: "Date", cell: ({ row }) => formatWhen(row.original.createdAt) },
    ];
}

function TagEditor({ tenant, detail, canEdit }: { tenant: string; detail: CustomerDetail; canEdit: boolean }): React.JSX.Element {
    const [draft, setDraft] = useState("");
    const [error, setError] = useState<string | null>(null);
    const update = useUpdateCustomerTags(tenant, detail.profile.email);
    const tags = detail.profile.tags;

    const add = (e: FormEvent<HTMLFormElement>): void => {
        e.preventDefault();
        const tag = draft.trim();
        if (!tag) return;
        if (tags.includes(tag)) {
            setError(`“${tag}” is already on this customer.`);
            return;
        }
        if (tags.length >= TAGS_MAX) {
            setError(`A customer can have at most ${TAGS_MAX} tags.`);
            return;
        }
        setError(null);
        setDraft("");
        update.mutate([...tags, tag]);
    };

    return (
        <AdminPanel id="tags" title="Tags" description="Tags feed segments (e.g. “vip”, “wholesale”). Changes save immediately.">
            {tags.length > 0 ? (
                <ul className={styles.chips} aria-label="Customer tags">
                    {tags.map((t) => (
                        <li key={t} className={styles.chip}>
                            {t}
                            <button type="button" className={styles.chipRemove} aria-label={`Remove tag ${t}`} disabled={!canEdit} onClick={() => update.mutate(tags.filter((x) => x !== t))}>
                                <X size={13} aria-hidden="true" />
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <PanelNote>No tags yet.</PanelNote>
            )}
            {canEdit ? (
                <form className={styles.tagForm} onSubmit={add}>
                    <Field label="Add a tag" {...(error ? { error } : {})}>
                        {(id, describedBy) => (
                            <Input id={id} value={draft} maxLength={TAG_MAX_LENGTH} onChange={(e) => setDraft(e.target.value)} aria-invalid={error ? true : undefined} aria-describedby={describedBy} placeholder="e.g. vip" />
                        )}
                    </Field>
                    <Button type="submit" variant="secondary" leftIcon={<Plus size={14} aria-hidden="true" />} disabled={!draft.trim()}>Add</Button>
                </form>
            ) : (
                <PanelNote>Viewers can&apos;t edit tags — ask a store admin.</PanelNote>
            )}
        </AdminPanel>
    );
}

export function CustomerDetailClient({ email }: { email: string }): React.JSX.Element {
    const { tenant, can } = useAdmin();
    const customer = useCustomer(tenant, email);
    const storeQs = `?store=${encodeURIComponent(tenant)}`;

    const breadcrumb = (
        <ol className={styles.crumbs}>
            <li><Link href={`/admin/customers${storeQs}`}>Customers</Link></li>
            <li aria-current="page">{email}</li>
        </ol>
    );

    if (customer.isPending) {
        return (
            <DetailLayout breadcrumb={breadcrumb} title={email}>
                <BrandSpinner mode="content" message="Loading the customer…" />
            </DetailLayout>
        );
    }
    if (customer.isError) {
        return (
            <DetailLayout breadcrumb={breadcrumb} title={email}>
                <LoadError message={customer.error.status === 404 ? "No customer with this email in this storefront." : `Couldn't load the customer: ${customer.error.message}`} onRetry={() => void customer.refetch()} />
            </DetailLayout>
        );
    }

    const d = customer.data;
    const p = d.profile;
    const aov = p.ordersCount > 0 ? Math.round(p.totalSpentCents / p.ordersCount) : 0;

    return (
        <DetailLayout
            breadcrumb={breadcrumb}
            title={p.name ?? p.email}
            subtitle={
                <>
                    {p.email}
                    {p.phone ? ` · ${p.phone}` : ""} · customer since {formatWhen(p.firstOrderAt ?? p.createdAt)}
                </>
            }
        >
            <StatSection
                stats={[
                    { label: "Orders", value: formatNumber(p.ordersCount), tone: p.ordersCount >= 2 ? "success" : "neutral", hint: p.ordersCount >= 2 ? "Repeat buyer" : "One-time or new" },
                    { label: "Lifetime spend", value: formatCents(p.totalSpentCents) },
                    { label: "Average order", value: formatCents(aov) },
                    { label: "Last order", value: formatShortDay(p.lastOrderAt), ...(p.lastOrderAt ? { hint: formatWhen(p.lastOrderAt) } : {}) },
                    { label: "Marketing", value: p.acceptsMarketing ? "Opted in" : "Not opted in", tone: p.acceptsMarketing ? "success" : "neutral" },
                ]}
            />
            <div className={styles.grid}>
                <div className={styles.stack}>
                    <AdminPanel id="orders" title="Orders">
                        {d.orders.length > 0 ? (
                            <DataTable columns={orderColumns(storeQs)} data={d.orders} getRowId={(o) => o.id} caption="Customer orders" />
                        ) : (
                            <PanelNote>No orders from this customer yet.</PanelNote>
                        )}
                    </AdminPanel>
                    <AdminPanel id="bookings" title="Bookings">
                        {d.bookings.length > 0 ? (
                            <ul className={styles.list}>
                                {d.bookings.map((b) => (
                                    <li key={b.id} className={styles.item}>
                                        <div className={styles.itemHead}>
                                            <span>{formatWhen(b.startsAt)}</span>
                                            <StatusBadge tone={BOOKING_TONES[b.status] ?? "neutral"}>{humanize(b.status)}</StatusBadge>
                                        </div>
                                        <span className={styles.muted}>{b.depositCents > 0 ? `Deposit ${formatCents(b.depositCents)}` : "No deposit"}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <PanelNote>No appointments booked.</PanelNote>
                        )}
                    </AdminPanel>
                    <AdminPanel id="reviews" title="Reviews">
                        {d.reviews.length > 0 ? (
                            <ul className={styles.list}>
                                {d.reviews.map((r) => (
                                    <li key={r.id} className={styles.item}>
                                        <div className={styles.itemHead}>
                                            <StarRating value={r.rating} />
                                            <StatusBadge tone={REVIEW_TONES[r.status]}>{humanize(r.status)}</StatusBadge>
                                        </div>
                                        <span>{r.body}</span>
                                        <span className={styles.muted}>{r.sku} · {formatWhen(r.createdAt)}{r.verified ? " · verified buyer" : ""}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <PanelNote>No reviews written.</PanelNote>
                        )}
                    </AdminPanel>
                </div>
                <div className={styles.stack}>
                    <TagEditor tenant={tenant} detail={d} canEdit={can("admin")} />
                    <AdminPanel id="memberships" title="Memberships">
                        {d.memberships.length > 0 ? (
                            <ul className={styles.list}>
                                {d.memberships.map((m) => (
                                    <li key={m.id} className={styles.item}>
                                        <div className={styles.itemHead}>
                                            <span>{m.sku}</span>
                                            <StatusBadge tone={m.status === "active" ? "success" : "neutral"}>{humanize(m.status)}</StatusBadge>
                                        </div>
                                        <span className={styles.muted}>Current period ends {formatWhen(m.currentPeriodEnd)}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <PanelNote>No memberships.</PanelNote>
                        )}
                    </AdminPanel>
                </div>
            </div>
        </DetailLayout>
    );
}
