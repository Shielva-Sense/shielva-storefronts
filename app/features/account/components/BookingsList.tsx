"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { confirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { BrandSpinner } from "@/components/ui/ProgressOverlay";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { ApiError } from "@/core/api-client";
import { formatDateTime, formatPrice, humanize } from "@/core/formatters";
import type { StoreSlug } from "@/features/storefront/types";
import { BOOKING_TONE } from "../constants";
import { useCancelBooking } from "../hooks";
import type { AccountBooking } from "../types";
import styles from "./Account.module.scss";

export function BookingsList({ store, query }: { store: StoreSlug; query: UseQueryResult<AccountBooking[], ApiError> }): React.JSX.Element {
    const cancel = useCancelBooking(store);

    const onCancel = async (b: AccountBooking): Promise<void> => {
        const ok = await confirmDialog({
            title: "Cancel this appointment?",
            description: `${b.service} with ${b.stylist} on ${formatDateTime(b.startsAt)}. Free up to 12 hours before.`,
            confirmLabel: "Cancel appointment",
            danger: true,
        });
        if (ok) cancel.mutate(b.id);
    };

    return (
        <section aria-labelledby="bookings-title" className={styles.section}>
            <h2 id="bookings-title" className={styles.h2}>Appointments</h2>
            {query.isPending ? <BrandSpinner mode="content" message="Loading your appointments…" /> : null}
            {query.isSuccess && query.data.length === 0 ? (
                <EmptyState title="No appointments yet" description="Book from the studio page — your appointments, deposits and reminders show up here." />
            ) : null}
            <ul className={styles.bookings}>
                {query.data?.map((b) => (
                    <li key={b.id} className={styles.booking}>
                        <div>
                            <p className={styles.orderName}>{b.service}</p>
                            <p className={styles.muted}>{formatDateTime(b.startsAt)} · with {b.stylist}{b.depositCents > 0 ? ` · ${formatPrice(b.depositCents / 100)} deposit` : ""}</p>
                        </div>
                        <div className="row row-wrap">
                            <StatusBadge tone={BOOKING_TONE[b.status] ?? "neutral"}>{b.status === "held" ? "Awaiting deposit" : humanize(b.status)}</StatusBadge>
                            {["held", "confirmed"].includes(b.status) ? <Button size="sm" variant="ghost" onClick={() => void onCancel(b)}>Cancel</Button> : null}
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
}
