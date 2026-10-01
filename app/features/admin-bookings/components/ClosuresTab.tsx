"use client";

import { useState, type FormEvent } from "react";
import { CalendarOff, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { confirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, Input, Select } from "@/components/ui/Field";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateKey, isDateKey, isPending } from "../constants";
import type { Closure, ClosureInput, StaffMember } from "../types";
import styles from "./Bookings.module.scss";

interface ClosuresTabProps {
    closures: readonly Closure[];
    staff: readonly StaffMember[];
    today: string;
    canEdit: boolean;
    onAdd: (input: ClosureInput) => void;
    onDelete: (id: string) => void;
}

const WHOLE_STUDIO = "";

/** Days off — whole-studio holidays or a single stylist's leave. Closed days offer no slots. */
export function ClosuresTab({ closures, staff, today, canEdit, onAdd, onDelete }: ClosuresTabProps): React.JSX.Element {
    const [date, setDate] = useState("");
    const [reason, setReason] = useState("");
    const [stylist, setStylist] = useState(WHOLE_STUDIO);
    const [submitted, setSubmitted] = useState(false);

    const errors = {
        date: isDateKey(date) ? undefined : "Pick a date.",
        reason: reason.trim() ? undefined : "Say why — customers see “closed” but your team sees this.",
    };
    const invalid = Boolean(errors.date ?? errors.reason);
    const nameOf = (id: string | null): string => (id ? (staff.find((s) => s.id === id)?.name ?? "Former stylist") : "Whole studio");

    const submit = (e: FormEvent<HTMLFormElement>): void => {
        e.preventDefault();
        setSubmitted(true);
        if (invalid || !canEdit) return;
        onAdd({ date, reason: reason.trim(), staffId: stylist || null });
        setDate("");
        setReason("");
        setStylist(WHOLE_STUDIO);
        setSubmitted(false);
    };

    const remove = async (c: Closure): Promise<void> => {
        const ok = await confirmDialog({
            title: `Remove the closure on ${formatDateKey(c.date)}?`,
            description: `${nameOf(c.staffId)} becomes bookable again on that day (${c.reason}).`,
            confirmLabel: "Remove closure",
            danger: true,
        });
        if (ok) onDelete(c.id);
    };

    return (
        <div className={styles.stack}>
            <form className={styles.panel} onSubmit={submit} noValidate aria-labelledby="closure-form-heading">
                <h2 id="closure-form-heading" className={styles.panelTitle}>Add a closure</h2>
                <div className={styles.closureForm}>
                    <Field label="Date" required error={submitted ? errors.date : undefined}>
                        {(id, d) => <Input id={id} type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} aria-describedby={d} aria-invalid={submitted && Boolean(errors.date)} aria-required="true" disabled={!canEdit} />}
                    </Field>
                    <Field label="Reason" required error={submitted ? errors.reason : undefined}>
                        {(id, d) => <Input id={id} value={reason} maxLength={120} placeholder="e.g. Public holiday" onChange={(e) => setReason(e.target.value)} aria-describedby={d} aria-invalid={submitted && Boolean(errors.reason)} aria-required="true" disabled={!canEdit} />}
                    </Field>
                    <Field label="Applies to">
                        {(id, d) => (
                            <Select id={id} value={stylist} onChange={(e) => setStylist(e.target.value)} aria-describedby={d} disabled={!canEdit}>
                                <option value={WHOLE_STUDIO}>Whole studio</option>
                                {staff.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </Select>
                        )}
                    </Field>
                    <Button type="submit" leftIcon={<Plus size={14} aria-hidden="true" />} disabled={!canEdit}>Add closure</Button>
                </div>
            </form>

            {closures.length === 0 ? (
                <EmptyState
                    icon={<CalendarOff size={32} aria-hidden="true" />}
                    title="No closures scheduled"
                    description="Closures block bookings for a day — for the whole studio (holidays, deep cleans) or a single stylist (leave, training). Existing bookings on that day are not cancelled automatically."
                />
            ) : (
                <ul className={styles.closures}>
                    {closures.map((c) => {
                        const past = c.date < today;
                        return (
                            <li key={c.id} className={styles.closure} data-past={past || undefined}>
                                <div>
                                    <p className={styles.strong}>{formatDateKey(c.date)}</p>
                                    <p className={styles.muted}>{c.reason}</p>
                                </div>
                                <div className={styles.closureSide}>
                                    <StatusBadge tone={c.staffId ? "info" : "warning"}>{nameOf(c.staffId)}</StatusBadge>
                                    {past ? <StatusBadge tone="neutral" dot={false}>Past</StatusBadge> : null}
                                    <button type="button" className={styles.iconBtnDanger} onClick={() => void remove(c)} disabled={!canEdit || isPending(c.id)} aria-label={`Remove closure on ${formatDateKey(c.date)}`}>
                                        <Trash2 size={15} aria-hidden="true" />
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
