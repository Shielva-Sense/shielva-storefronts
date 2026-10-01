"use client";

import Link from "next/link";
import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { UserRound } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, Select } from "@/components/ui/Field";
import { Pagination } from "@/components/ui/Pagination";
import { BrandSpinner, ProgressOverlay } from "@/components/ui/ProgressOverlay";
import { StatSection } from "@/components/ui/StatSection";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SearchInput, Toolbar } from "@/components/ui/Toolbar";
import { ListLayout } from "@/components/layouts/ListLayout";
import { formatCents, formatNumber, formatWhen } from "@/core/formatters";
import { useColumnSort, useDebouncedValue, usePagination, useSearchParam } from "@/core/hooks";
import { useAdmin } from "@/features/admin-session/AdminContext";
import { LoadError } from "@/components/ui/Panel";
import { SegmentModal } from "@/features/admin-customers/components/SegmentModal";
import { SegmentsPanel } from "@/features/admin-customers/components/SegmentsPanel";
import { CUSTOMER_SORTS, CUSTOMERS_PAGE_SIZE } from "@/features/admin-customers/constants";
import { useCreateSegment, useCustomers, useSegments } from "@/features/admin-customers/hooks";
import type { Customer, SegmentInput } from "@/features/admin-customers/types";
import styles from "./Customers.module.scss";

function buildColumns(storeQs: string): ColumnDef<Customer, unknown>[] {
    return [
        { id: "email", header: "Email", cell: ({ row }) => <Link className={styles.link} href={`/admin/customers/${encodeURIComponent(row.original.email)}${storeQs}`}>{row.original.email}</Link> },
        { id: "name", header: "Name", cell: ({ row }) => row.original.name ?? <span className={styles.muted}>—</span> },
        { id: "orders", header: "Orders", cell: ({ row }) => <span className={styles.num}>{formatNumber(row.original.ordersCount)}</span> },
        { id: "spent", header: "Total spent", cell: ({ row }) => <span className={styles.num}>{formatCents(row.original.totalSpentCents)}</span> },
        { id: "last", header: "Last order", cell: ({ row }) => formatWhen(row.original.lastOrderAt) },
        {
            id: "tags",
            header: "Tags",
            cell: ({ row }) =>
                row.original.tags.length > 0 ? (
                    <span className={styles.tags}>{row.original.tags.map((t) => <StatusBadge key={t} tone="neutral" dot={false}>{t}</StatusBadge>)}</span>
                ) : (
                    <span className={styles.muted}>—</span>
                ),
        },
    ];
}

export function CustomersClient(): React.JSX.Element {
    const { tenant, can } = useAdmin();
    const canEdit = can("admin");
    const [search, setSearch] = useSearchParam("q");
    const debouncedSearch = useDebouncedValue(search);
    const [segment, setSegment] = useSearchParam("segment");
    const sort = useColumnSort("spent", "desc");
    const sortId = (CUSTOMER_SORTS as readonly string[]).includes(sort.sort) ? sort.sort : "spent";
    const { page, size, setPage } = usePagination(CUSTOMERS_PAGE_SIZE);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalKey, setModalKey] = useState(0);

    const customers = useCustomers(tenant, { q: debouncedSearch.trim(), segment, sort: sortId, dir: sort.dir, page, size });
    const segments = useSegments(tenant);
    const createSegment = useCreateSegment(tenant);
    const items = customers.data?.items ?? [];
    const columns = buildColumns(`?store=${encodeURIComponent(tenant)}`);
    const activeSegment = segments.data?.items.find((s) => s.id === segment);

    const spent = items.reduce((n, c) => n + c.totalSpentCents, 0);
    const repeat = items.filter((c) => c.ordersCount >= 2).length;
    const marketing = items.filter((c) => c.acceptsMarketing).length;

    const save = (input: SegmentInput & { previewCount: number }): void => {
        createSegment.mutate(input, {
            onSuccess: () => {
                setModalOpen(false);
                setModalKey((k) => k + 1);
            },
        });
    };

    const segmentSelect = (
        <div className={styles.segmentFilter}>
            <Field label="Segment" hideLabel>
                {(id) => (
                    <Select id={id} value={segment} onChange={(e) => setSegment(e.target.value)}>
                        <option value="">All customers</option>
                        {(segments.data?.items ?? []).filter((s) => !s.id.startsWith("pending-")).map((s) => (
                            <option key={s.id} value={s.id}>{s.name} ({formatNumber(s.count)})</option>
                        ))}
                    </Select>
                )}
            </Field>
        </div>
    );

    return (
        <ListLayout
            title="Customers"
            subtitle="Everyone who has ordered or signed in, with lifetime value from Shopify orders. Segments turn rules into reusable audiences."
            stats={
                <StatSection
                    show={customers.isSuccess}
                    stats={[
                        { label: activeSegment ? `In "${activeSegment.name}"` : "Customers", value: formatNumber(customers.data?.total ?? 0), hint: `${formatNumber(items.length)} on this page` },
                        { label: "Spent (this page)", value: formatCents(spent), hint: items.length ? `${formatCents(Math.round(spent / items.length))} per customer` : "No customers shown" },
                        { label: "Repeat buyers", value: formatNumber(repeat), hint: "2+ orders, this page", tone: repeat > 0 ? "success" : "neutral" },
                        { label: "Marketing opt-in", value: formatNumber(marketing), hint: "Accepts email marketing, this page" },
                    ]}
                />
            }
            aboveContent={<SegmentsPanel tenant={tenant} canEdit={canEdit} activeId={segment} onFilter={setSegment} onCreate={() => setModalOpen(true)} />}
            toolbar={<Toolbar label="Customer filters" start={<SearchInput label="Search customers" value={search} onChange={setSearch} />} end={segmentSelect} />}
        >
            {customers.isPending ? <BrandSpinner mode="content" message="Loading customers…" /> : null}
            {customers.isError ? <LoadError message={`Couldn't load customers: ${customers.error.message}`} onRetry={() => void customers.refetch()} /> : null}
            {customers.isSuccess && items.length === 0 ? (
                <EmptyState
                    icon={<UserRound size={32} aria-hidden="true" />}
                    title={debouncedSearch || segment ? "No customers match" : "No customers yet"}
                    description={
                        debouncedSearch || segment
                            ? "Clear the search or pick another segment. Search matches email and name."
                            : "Customer profiles are created from Shopify orders and storefront sign-ins. Order count, lifetime spend and last order date update with every paid order."
                    }
                />
            ) : null}
            {items.length > 0 ? (
                <>
                    <DataTable columns={columns} data={items} getRowId={(c) => c.id} caption="Customers" sort={{ id: sortId, dir: sort.dir, sortable: CUSTOMER_SORTS, onToggle: sort.toggle }} />
                    {customers.data ? <Pagination page={customers.data.page} pages={customers.data.pages} total={customers.data.total} size={customers.data.size} onPage={setPage} /> : null}
                </>
            ) : null}

            <SegmentModal key={modalKey} open={modalOpen} tenant={tenant} saving={createSegment.isPending} onClose={() => setModalOpen(false)} onSave={save} />
            <ProgressOverlay open={createSegment.isPending} message="Saving the segment…" />
        </ListLayout>
    );
}
