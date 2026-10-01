"use client";

import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { confirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatPrice } from "@/core/formatters";
import { addDays, BOOKING_STATUS_LABEL, BOOKING_STATUS_TONE, BOOKING_TRANSITIONS, BOOKING_WINDOW_DAYS, dayKeyIn, formatDateKey, formatTimeIn, TRANSITION_ACTION } from "../constants";
import type { Booking, BookingStatus } from "../types";
import styles from "./Bookings.module.scss";

interface ScheduleTabProps {
    from: string;
    today: string;
    timezone: string;
    bookings: readonly Booking[];
    canEdit: boolean;
    onStatus: (id: string, status: BookingStatus) => void;
}

const DAY_OFFSETS = Array.from({ length: BOOKING_WINDOW_DAYS }, (_, i) => i);

/** One week of bookings grouped by store-local day, with the allowed status transitions per booking. */
export function ScheduleTab({ from, today, timezone, bookings, canEdit, onStatus }: ScheduleTabProps): React.JSX.Element {
    const byDay = new Map<string, Booking[]>();
    for (const b of bookings) {
        const key = dayKeyIn(b.startsAt, timezone);
        byDay.set(key, [...(byDay.get(key) ?? []), b]);
    }

    const act = async (b: Booking, status: BookingStatus): Promise<void> => {
        const confirm = TRANSITION_ACTION[status]?.confirm;
        if (confirm) {
            const ok = await confirmDialog({ ...confirm, description: `${b.customerName} · ${b.service} with ${b.stylist}. ${confirm.description}`, danger: true });
            if (!ok) return;
        }
        onStatus(b.id, status);
    };

    if (bookings.length === 0)
        return (
            <EmptyState
                icon={<CalendarDays size={32} aria-hidden="true" />}
                title="No bookings this week"
                description="Bookings arrive from the storefront booking widget: a slot is held while the customer pays the deposit, then confirmed. Use the week controls to look ahead, or check staff hours and closures if slots aren't showing."
            />
        );

    return (
        <ol className={styles.days}>
            {DAY_OFFSETS.map((offset) => {
                const key = addDays(from, offset);
                const list = byDay.get(key) ?? [];
                return (
                    <li key={key} className={styles.day} data-today={key === today || undefined}>
                        <h2 className={styles.dayHeading}>
                            {formatDateKey(key)}
                            {key === today ? <StatusBadge tone="info" dot={false}>Today</StatusBadge> : null}
                            <span className={styles.dayCount}>{list.length === 1 ? "1 booking" : `${list.length} bookings`}</span>
                        </h2>
                        {list.length === 0 ? (
                            <p className={styles.muted}>Nothing booked.</p>
                        ) : (
                            <ol className={styles.bookings}>
                                {list.map((b) => {
                                    const next = BOOKING_TRANSITIONS[b.status] ?? [];
                                    return (
                                        <li key={b.id} className={styles.booking}>
                                            <p className={styles.time}>
                                                <time dateTime={b.startsAt}>{formatTimeIn(b.startsAt, timezone)}</time>
                                                <span aria-hidden="true"> – </span>
                                                <span className="visually-hidden"> to </span>
                                                <time dateTime={b.endsAt}>{formatTimeIn(b.endsAt, timezone)}</time>
                                            </p>
                                            <div className={styles.bookingMain}>
                                                <p className={styles.bookingTitle}>
                                                    {b.service} <span className={styles.muted}>with {b.stylist}</span>
                                                </p>
                                                <p className={styles.bookingMeta}>
                                                    <span>{b.customerName}</span>
                                                    <a href={`mailto:${b.customerEmail}`}>{b.customerEmail}</a>
                                                    <span>{b.depositCents > 0 ? `Deposit ${formatPrice(b.depositCents / 100)}` : "No deposit"}</span>
                                                    {b.status === "held" && b.holdExpiresAt ? <span>Hold expires {formatTimeIn(b.holdExpiresAt, timezone)}</span> : null}
                                                </p>
                                            </div>
                                            <div className={styles.bookingSide}>
                                                <StatusBadge tone={BOOKING_STATUS_TONE[b.status]}>{BOOKING_STATUS_LABEL[b.status]}</StatusBadge>
                                                {next.length > 0 ? (
                                                    <div className={styles.bookingActions}>
                                                        {next.map((s) => (
                                                            <Button key={s} size="sm" variant={s === "completed" ? "secondary" : "ghost"} onClick={() => void act(b, s)} disabled={!canEdit} aria-label={`${TRANSITION_ACTION[s]?.label ?? s}: ${b.customerName}, ${formatTimeIn(b.startsAt, timezone)}`}>
                                                                {TRANSITION_ACTION[s]?.label ?? s}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                ) : null}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ol>
                        )}
                    </li>
                );
            })}
        </ol>
    );
}
