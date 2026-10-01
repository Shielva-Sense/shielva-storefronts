"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Scissors } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatPrice } from "@/core/formatters";
import { isPending } from "../constants";
import type { Service } from "../types";
import styles from "./Bookings.module.scss";

interface ServicesTabProps {
    services: readonly Service[];
    canEdit: boolean;
    onNew: () => void;
    onEdit: (service: Service) => void;
}

/** The bookable service menu. */
export function ServicesTab({ services, canEdit, onNew, onEdit }: ServicesTabProps): React.JSX.Element {
    const columns = useMemo<ColumnDef<Service, unknown>[]>(
        () => [
            {
                id: "name",
                header: "Service",
                cell: ({ row }) => (
                    <div className={styles.nameCell}>
                        <span className={styles.strong}>{row.original.name}</span>
                        <code className={styles.code}>{row.original.handle}</code>
                    </div>
                ),
            },
            { id: "category", header: "Category", cell: ({ row }) => <span className={styles.capitalize}>{row.original.category}</span> },
            { id: "minutes", header: "Minutes", cell: ({ row }) => <span className={styles.num}>{row.original.minutes}</span> },
            { id: "price", header: "Price", cell: ({ row }) => <span className={styles.num}>{formatPrice(row.original.priceCents / 100)}</span> },
            { id: "deposit", header: "Deposit", cell: ({ row }) => <span className={styles.num}>{row.original.depositCents > 0 ? formatPrice(row.original.depositCents / 100) : "None"}</span> },
            { id: "active", header: "Status", cell: ({ row }) => <StatusBadge tone={row.original.active ? "success" : "neutral"}>{row.original.active ? "Active" : "Hidden"}</StatusBadge> },
            {
                id: "actions",
                header: () => <span className="visually-hidden">Actions</span>,
                cell: ({ row }) => (
                    <Button variant="secondary" size="sm" leftIcon={<Pencil size={14} aria-hidden="true" />} onClick={() => onEdit(row.original)} disabled={isPending(row.original.id)} aria-label={`Edit ${row.original.name}`}>
                        Edit
                    </Button>
                ),
            },
        ],
        [onEdit],
    );

    if (services.length === 0)
        return (
            <EmptyState
                icon={<Scissors size={32} aria-hidden="true" />}
                title="No services yet"
                description="Services are what customers book: each has a duration, a price and an optional deposit charged to hold the slot. Add one, then assign it to stylists on the Staff tab."
                action={canEdit ? <Button onClick={onNew}>Add the first service</Button> : undefined}
            />
        );

    return <DataTable columns={columns} data={services} getRowId={(s) => s.id} caption="Bookable services" />;
}
