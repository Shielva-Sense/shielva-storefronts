"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Receipt } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { BrandSpinner } from "@/components/ui/ProgressOverlay";
import { StatSection } from "@/components/ui/StatSection";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TabNav } from "@/components/ui/TabNav";
import { SearchInput, Toolbar } from "@/components/ui/Toolbar";
import { ListLayout } from "@/components/layouts/ListLayout";
import { formatCents, formatNumber, formatWhen, humanize } from "@/core/formatters";
import { useColumnSort, useDebouncedValue, usePagination, useSearchParam } from "@/core/hooks";
import { useAdmin } from "@/features/admin-session/AdminContext";
import { LoadError } from "@/components/ui/Panel";
import { financialTone, fulfillmentLabel, fulfillmentTone, ORDER_SORTS, ORDER_STATUS_TABS, ORDERS_PAGE_SIZE, type OrderStatusTab } from "@/features/admin-orders/constants";
import { useOrders } from "@/features/admin-orders/hooks";
import type { OrderListItem } from "@/features/admin-orders/types";
import styles from "./Orders.module.scss";

const TAB_PREFIX = "orders-status";

function buildColumns(storeQs: string): ColumnDef<OrderListItem, unknown>[] {
    return [
        {
            id: "name",
            header: "Order",
            cell: ({ row }) => (
                <Link className={styles.link} href={`/admin/orders/${row.original.id}${storeQs}`}>{row.original.name}</Link>
            ),
        },
        {
            id: "customer",
            header: "Customer",
            cell: ({ row }) => (
                <span className={styles.customer}>
                    <span>{row.original.customerName ?? "Guest"}</span>
                    {row.original.email ? <span className={styles.muted}>{row.original.email}</span> : null}
                </span>
            ),
        },
        { id: "payment", header: "Payment", cell: ({ row }) => <StatusBadge tone={financialTone(row.original.financialStatus)}>{humanize(row.original.financialStatus)}</StatusBadge> },
        {
            id: "fulfillment",
            header: "Fulfillment",
            cell: ({ row }) => {
                const cancelled = row.original.cancelledAt !== null;
                return <StatusBadge tone={fulfillmentTone(row.original.fulfillmentStatus, cancelled)}>{fulfillmentLabel(row.original.fulfillmentStatus, cancelled)}</StatusBadge>;
            },
        },
        { id: "total", header: "Total", cell: ({ row }) => <span className={styles.num}>{formatCents(row.original.totalCents)}</span> },
        { id: "refunded", header: "Refunded", cell: ({ row }) => (row.original.totalRefundedCents > 0 ? <span className={styles.refunded}>{formatCents(row.original.totalRefundedCents)}</span> : <span className={styles.muted}>—</span>) },
        { id: "created", header: "Date", cell: ({ row }) => formatWhen(row.original.createdAt) },
    ];
}

export function OrdersClient(): React.JSX.Element {
    const { tenant } = useAdmin();
    const [statusRaw, setStatus] = useSearchParam("status", "all");
    const status: OrderStatusTab = ORDER_STATUS_TABS.find((t) => t.id === statusRaw)?.id ?? "all";
    const [search, setSearch] = useSearchParam("q");
    const debouncedSearch = useDebouncedValue(search);
    const sort = useColumnSort("created", "desc");
    const sortId = (ORDER_SORTS as readonly string[]).includes(sort.sort) ? sort.sort : "created";
    const { page, size, setPage } = usePagination(ORDERS_PAGE_SIZE);

    const orders = useOrders(tenant, { q: debouncedSearch.trim(), status, sort: sortId, dir: sort.dir, page, size });
    const items = orders.data?.items ?? [];
    const columns = buildColumns(`?store=${encodeURIComponent(tenant)}`);

    const gross = items.reduce((n, o) => n + o.totalCents, 0);
    const refunded = items.reduce((n, o) => n + o.totalRefundedCents, 0);
    const filtered = Boolean(debouncedSearch) || status !== "all";

    return (
        <ListLayout
            title="Orders"
            subtitle="Every Shopify order for this storefront — payments, fulfilment and refunds mirrored in near real time by webhooks."
            stats={
                <StatSection
                    show={orders.isSuccess}
                    stats={[
                        { label: "Orders matching", value: formatNumber(orders.data?.total ?? 0), hint: `${formatNumber(items.length)} on this page` },
                        { label: "Gross on page", value: formatCents(gross), hint: "Order totals shown below" },
                        { label: "Refunded on page", value: formatCents(refunded), tone: refunded > 0 ? "warning" : "neutral", hint: "Refunds recorded by Shopify" },
                    ]}
                />
            }
            tabs={<TabNav label="Order status" idPrefix={TAB_PREFIX} tabs={ORDER_STATUS_TABS} active={status} onChange={setStatus} />}
            toolbar={<Toolbar label="Order filters" start={<SearchInput label="Search orders" value={search} onChange={setSearch} />} />}
        >
            <div role="tabpanel" id={`${TAB_PREFIX}-panel`} aria-labelledby={`${TAB_PREFIX}-tab-${status}`}>
                {orders.isPending ? <BrandSpinner mode="content" message="Loading orders…" /> : null}
                {orders.isError ? <LoadError message={`Couldn't load orders: ${orders.error.message}`} onRetry={() => void orders.refetch()} /> : null}
                {orders.isSuccess && items.length === 0 ? (
                    <EmptyState
                        icon={<Receipt size={32} aria-hidden="true" />}
                        title={filtered ? "No orders match these filters" : "No orders yet"}
                        description={
                            filtered
                                ? "Try another status tab or clear the search. Search matches the order number, customer email and customer name."
                                : "Orders are created in Shopify checkout and arrive here through the orders/create webhook, along with their payments, shipments and refunds."
                        }
                    />
                ) : null}
                {items.length > 0 ? (
                    <>
                        <DataTable
                            columns={columns}
                            data={items}
                            getRowId={(o) => o.id}
                            caption="Orders"
                            sort={{ id: sortId, dir: sort.dir, sortable: ORDER_SORTS, onToggle: sort.toggle }}
                        />
                        {orders.data ? <Pagination page={orders.data.page} pages={orders.data.pages} total={orders.data.total} size={orders.data.size} onPage={setPage} /> : null}
                    </>
                ) : null}
            </div>
        </ListLayout>
    );
}
