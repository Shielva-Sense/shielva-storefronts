"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Checkbox, Field, Input } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { slugify } from "@/features/admin-content/constants";
import { DEFAULT_SHIFT, HANDLE_RE, minutesToTime, timeToMinutes, WEEKDAYS } from "../constants";
import type { Service, StaffInput, StaffMember, StaffShift } from "../types";
import styles from "./Bookings.module.scss";

interface StaffEditorProps {
    member: StaffMember | null;
    services: readonly Service[];
    canEdit: boolean;
    onClose: () => void;
    onSave: (input: StaffInput) => void;
}

interface DayDraft {
    works: boolean;
    start: string;
    end: string;
    /** Additional split shifts on this weekday — preserved as-is (the editor edits the first shift). */
    extra: StaffShift[];
}

function toDays(hours: readonly StaffShift[]): DayDraft[] {
    return WEEKDAYS.map(({ day }) => {
        const shifts = hours.filter((h) => h.weekday === day).sort((a, b) => a.startMin - b.startMin);
        const first = shifts[0];
        return {
            works: Boolean(first),
            start: minutesToTime(first?.startMin ?? DEFAULT_SHIFT.startMin),
            end: minutesToTime(first?.endMin ?? DEFAULT_SHIFT.endMin),
            extra: shifts.slice(1),
        };
    });
}

/** Create / edit a stylist: profile, the services they perform, and their weekly hours. */
export function StaffEditor({ member, services, canEdit, onClose, onSave }: StaffEditorProps): React.JSX.Element {
    const [name, setName] = useState(member?.name ?? "");
    const [handle, setHandle] = useState(member?.handle ?? "");
    const [handleTouched, setHandleTouched] = useState(member !== null);
    const [level, setLevel] = useState(member?.level ?? "");
    const [specialty, setSpecialty] = useState(member?.specialty ?? "");
    const [active, setActive] = useState(member?.active ?? true);
    const [serviceHandles, setServiceHandles] = useState<string[]>(member?.serviceHandles ?? []);
    const [days, setDays] = useState<DayDraft[]>(() => toDays(member?.hours ?? []));
    const [submitted, setSubmitted] = useState(false);

    const setDay = (i: number, patch: Partial<DayDraft>): void => setDays((ds) => ds.map((d, j) => (j === i ? { ...d, ...patch } : d)));
    const toggleService = (h: string, on: boolean): void => setServiceHandles((cur) => (on ? [...cur, h] : cur.filter((x) => x !== h)));

    const dayErrors = days.map((d) => {
        if (!d.works) return undefined;
        const s = timeToMinutes(d.start);
        const e = timeToMinutes(d.end);
        return s === null || e === null ? "Enter start and end times." : e <= s ? "The shift must end after it starts." : undefined;
    });
    const errors = {
        name: name.trim() ? undefined : "Enter the stylist's name.",
        handle: HANDLE_RE.test(handle) && handle.length <= 60 ? undefined : "Lowercase letters and numbers separated by hyphens.",
        level: level.trim() ? undefined : "e.g. Senior, Master, Director.",
    };
    const invalid = Object.values(errors).some(Boolean) || dayErrors.some(Boolean);
    const show = (k: keyof typeof errors): string | undefined => (submitted ? errors[k] : undefined);

    const save = (): void => {
        setSubmitted(true);
        if (invalid || !canEdit) return;
        const hours: StaffShift[] = days.flatMap((d, weekday) => {
            if (!d.works) return [];
            return [{ weekday, startMin: timeToMinutes(d.start) ?? DEFAULT_SHIFT.startMin, endMin: timeToMinutes(d.end) ?? DEFAULT_SHIFT.endMin }, ...d.extra];
        });
        onSave({ handle, name: name.trim(), level: level.trim(), specialty: specialty.trim(), active, serviceHandles, hours });
    };

    return (
        <Modal
            open
            size="lg"
            onClose={onClose}
            title={member ? `Edit ${member.name}` : "Add a stylist"}
            description="Availability on the storefront is computed from these weekly hours, the services the stylist performs, and any closures."
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={save} disabled={!canEdit || (submitted && invalid)}>Save stylist</Button>
                </>
            }
        >
            <div className={styles.form}>
                <div className={styles.twoCol}>
                    <Field label="Name" required error={show("name")}>
                        {(id, d) => (
                            <Input
                                id={id}
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    if (!handleTouched) setHandle(slugify(e.target.value).slice(0, 60));
                                }}
                                aria-describedby={d}
                                aria-invalid={Boolean(show("name"))}
                                aria-required="true"
                                disabled={!canEdit}
                            />
                        )}
                    </Field>
                    <Field label="Handle" required help={member ? "Fixed — it identifies the stylist in bookings." : "Used in booking links."} error={show("handle")}>
                        {(id, d) => (
                            <Input
                                id={id}
                                value={handle}
                                onChange={(e) => {
                                    setHandleTouched(true);
                                    setHandle(e.target.value.toLowerCase());
                                }}
                                aria-describedby={d}
                                aria-invalid={Boolean(show("handle"))}
                                aria-required="true"
                                spellCheck={false}
                                disabled={!canEdit || member !== null}
                            />
                        )}
                    </Field>
                    <Field label="Level" required error={show("level")}>
                        {(id, d) => <Input id={id} value={level} maxLength={40} onChange={(e) => setLevel(e.target.value)} aria-describedby={d} aria-invalid={Boolean(show("level"))} aria-required="true" disabled={!canEdit} />}
                    </Field>
                    <Field label="Specialty">
                        {(id, d) => <Input id={id} value={specialty} maxLength={120} onChange={(e) => setSpecialty(e.target.value)} aria-describedby={d} disabled={!canEdit} />}
                    </Field>
                </div>
                <Checkbox label="Active — takes new bookings" checked={active} onChange={setActive} disabled={!canEdit} />

                <fieldset className={styles.fieldset}>
                    <legend className={styles.legend}>Services performed</legend>
                    {services.length === 0 ? (
                        <p className={styles.muted}>Add services first — then assign them here.</p>
                    ) : (
                        <div className={styles.checkGrid}>
                            {services.map((s) => (
                                <Checkbox key={s.handle} label={s.name} checked={serviceHandles.includes(s.handle)} onChange={(v) => toggleService(s.handle, v)} disabled={!canEdit} />
                            ))}
                        </div>
                    )}
                </fieldset>

                <fieldset className={styles.fieldset}>
                    <legend className={styles.legend}>Weekly hours (store time)</legend>
                    <ul className={styles.hours}>
                        {WEEKDAYS.map((w, i) => {
                            const d = days[i];
                            if (!d) return null;
                            const err = submitted ? dayErrors[i] : undefined;
                            return (
                                <li key={w.day} className={styles.hoursRow}>
                                    <Checkbox label={w.long} checked={d.works} onChange={(v) => setDay(i, { works: v })} disabled={!canEdit} />
                                    {d.works ? (
                                        <>
                                            <Field label={`${w.long} start`} hideLabel>
                                                {(id) => <Input id={id} type="time" step={900} value={d.start} onChange={(e) => setDay(i, { start: e.target.value })} aria-invalid={Boolean(err)} disabled={!canEdit} />}
                                            </Field>
                                            <span className={styles.muted} aria-hidden="true">to</span>
                                            <Field label={`${w.long} end`} hideLabel error={err}>
                                                {(id, dsc) => <Input id={id} type="time" step={900} value={d.end} onChange={(e) => setDay(i, { end: e.target.value })} aria-describedby={dsc} aria-invalid={Boolean(err)} disabled={!canEdit} />}
                                            </Field>
                                            {d.extra.length > 0 ? <span className={styles.muted}>+{d.extra.length} split shift kept</span> : null}
                                        </>
                                    ) : (
                                        <span className={styles.muted}>Day off</span>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </fieldset>
            </div>
        </Modal>
    );
}
