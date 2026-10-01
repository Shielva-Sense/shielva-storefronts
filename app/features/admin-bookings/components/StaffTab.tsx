"use client";

import { Pencil, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatNumber } from "@/core/formatters";
import { isPending, shiftSummary, weeklyMinutes } from "../constants";
import type { Service, StaffMember } from "../types";
import styles from "./Bookings.module.scss";

interface StaffTabProps {
    staff: readonly StaffMember[];
    services: readonly Service[];
    canEdit: boolean;
    onNew: () => void;
    onEdit: (member: StaffMember) => void;
}

/** Stylist cards: profile, services performed and the weekly schedule that drives availability. */
export function StaffTab({ staff, services, canEdit, onNew, onEdit }: StaffTabProps): React.JSX.Element {
    if (staff.length === 0)
        return (
            <EmptyState
                icon={<Users size={32} aria-hidden="true" />}
                title="No stylists yet"
                description="Stylists own the calendar: the booking widget only offers slots inside a stylist's weekly hours, for services they perform. Add your first team member to open bookings."
                action={canEdit ? <Button onClick={onNew}>Add the first stylist</Button> : undefined}
            />
        );

    const nameOf = (handle: string): string => services.find((s) => s.handle === handle)?.name ?? handle;

    return (
        <ul className={styles.cards}>
            {staff.map((m) => {
                const hours = weeklyMinutes(m.hours) / 60;
                const days = new Set(m.hours.map((h) => h.weekday)).size;
                return (
                    <li key={m.id} className={styles.card} aria-busy={isPending(m.id) || undefined}>
                        <div className={styles.cardHead}>
                            <div>
                                <h2 className={styles.cardTitle}>{m.name}</h2>
                                <p className={styles.muted}>{m.level}{m.specialty ? ` · ${m.specialty}` : ""}</p>
                            </div>
                            <StatusBadge tone={m.active ? "success" : "neutral"}>{m.active ? "Taking bookings" : "Inactive"}</StatusBadge>
                        </div>
                        <dl className={styles.cardFacts}>
                            <div>
                                <dt>Weekly hours</dt>
                                <dd>{days} {days === 1 ? "day" : "days"} · {formatNumber(Math.round(hours * 10) / 10)} h</dd>
                            </div>
                            <div>
                                <dt>Schedule</dt>
                                <dd>{shiftSummary(m.hours)}</dd>
                            </div>
                            <div>
                                <dt>Services ({m.serviceHandles.length})</dt>
                                <dd>{m.serviceHandles.length > 0 ? m.serviceHandles.map(nameOf).join(", ") : "None assigned — not bookable"}</dd>
                            </div>
                        </dl>
                        <div className={styles.cardActions}>
                            <Button variant="secondary" size="sm" leftIcon={<Pencil size={14} aria-hidden="true" />} onClick={() => onEdit(m)} disabled={isPending(m.id)} aria-label={`Edit ${m.name}`}>
                                Edit
                            </Button>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}
