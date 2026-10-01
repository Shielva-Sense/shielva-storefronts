"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { BadgeCheck } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateTime } from "@/core/formatters";
import { MEMBERSHIP_LABEL, MEMBERSHIP_TONE } from "../constants";
import type { Membership } from "../types";
import styles from "./Bookings.module.scss";

const COLUMNS: ColumnDef<Membership, unknown>[] = [
    { id: "customer", header: "Customer", cell: ({ row }) => <a href={`mailto:${row.original.customerEmail}`}>{row.original.customerEmail}</a> },
    { id: "sku", header: "Plan (SKU)", cell: ({ row }) => <code className={styles.code}>{row.original.sku}</code> },
    { id: "status", header: "Status", cell: ({ row }) => <StatusBadge tone={MEMBERSHIP_TONE[row.original.status]}>{MEMBERSHIP_LABEL[row.original.status]}</StatusBadge> },
    {
        id: "period",
        header: "Renews / ends",
        cell: ({ row }) => {
            const when = formatDateTime(row.original.currentPeriodEnd);
            return row.original.status === "active" ? `Renews ${when}` : `Ended ${when}`;
        },
    },
    { id: "order", header: "Shopify order", cell: ({ row }) => <code className={styles.code}>{row.original.shopifyOrderId}</code> },
];

/** Recurring memberships sold through Shopify checkout. Read-only here. */
export function MembershipsTab({ memberships }: { memberships: readonly Membership[] }): React.JSX.Element {
    if (memberships.length === 0)
        return (
            <EmptyState
                icon={<BadgeCheck size={32} aria-hidden="true" />}
                title="No memberships yet"
                description="Memberships are recurring plans (e.g. monthly blow-dries) bought at checkout. Each paid order creates or renews one here; renewals and cancellations sync from Shopify."
            />
        );
    return <DataTable columns={COLUMNS} data={memberships} getRowId={(m) => m.id} caption="Memberships" />;
}
