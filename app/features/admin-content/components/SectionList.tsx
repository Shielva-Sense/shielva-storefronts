"use client";

import { ArrowDown, ArrowUp, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Field";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateTime } from "@/core/formatters";
import { isPending, scheduleState } from "../constants";
import type { PageSection, SectionDef } from "../types";
import styles from "./PageBuilder.module.scss";

interface SectionListProps {
    sections: readonly PageSection[];
    library: readonly SectionDef[];
    canEdit: boolean;
    onMove: (index: number, delta: -1 | 1) => void;
    onToggle: (section: PageSection, enabled: boolean) => void;
    onEdit: (section: PageSection) => void;
    onDelete: (section: PageSection, label: string) => void;
}

function scheduleText(s: PageSection): string {
    const from = s.startsAt ? `from ${formatDateTime(s.startsAt)}` : "";
    const to = s.endsAt ? `until ${formatDateTime(s.endsAt)}` : "";
    return [from, to].filter(Boolean).join(" ");
}

/** The ordered section stack — exactly what the storefront renders, top to bottom. */
export function SectionList({ sections, library, canEdit, onMove, onToggle, onEdit, onDelete }: SectionListProps): React.JSX.Element {
    return (
        <ol className={styles.sections}>
            {sections.map((s, i) => {
                const def = library.find((d) => d.type === s.type);
                const label = def?.label ?? s.type;
                const pending = isPending(s.id);
                const locked = !canEdit || pending;
                const schedule = scheduleState(s.startsAt, s.endsAt);
                const ab = s.variantBProps !== null && s.abSplit > 0;
                return (
                    <li key={s.id} className={styles.sectionRow} data-disabled={!s.enabled || undefined} aria-busy={pending || undefined}>
                        <span className={styles.position} aria-hidden="true">{i + 1}</span>
                        <div className={styles.sectionMain}>
                            <p className={styles.sectionLabel}>
                                <span className="visually-hidden">Position {i + 1}: </span>
                                {label}
                            </p>
                            <p className={styles.sectionMeta}>
                                <code className={styles.type}>{s.type}</code>
                                <StatusBadge tone={s.enabled ? "success" : "neutral"}>{s.enabled ? "Visible" : "Hidden"}</StatusBadge>
                                {ab ? <StatusBadge tone="info">A/B {s.abSplit}%</StatusBadge> : null}
                                {schedule ? (
                                    <span className={styles.schedule}>
                                        <StatusBadge tone={schedule.tone}>{schedule.label}</StatusBadge>
                                        <span>{scheduleText(s)}</span>
                                    </span>
                                ) : null}
                            </p>
                        </div>
                        <div className={styles.sectionControls}>
                            <Checkbox label="Enabled" checked={s.enabled} onChange={(v) => onToggle(s, v)} disabled={locked} />
                            <div className={styles.iconGroup}>
                                <button type="button" className={styles.iconBtn} onClick={() => onMove(i, -1)} disabled={locked || i === 0} aria-label={`Move ${label} up`}>
                                    <ArrowUp size={15} aria-hidden="true" />
                                </button>
                                <button type="button" className={styles.iconBtn} onClick={() => onMove(i, 1)} disabled={locked || i === sections.length - 1} aria-label={`Move ${label} down`}>
                                    <ArrowDown size={15} aria-hidden="true" />
                                </button>
                            </div>
                            <Button variant="secondary" size="sm" leftIcon={<Pencil size={14} aria-hidden="true" />} onClick={() => onEdit(s)} disabled={pending} aria-label={`Edit ${label}`}>
                                Edit
                            </Button>
                            <button type="button" className={styles.iconBtnDanger} onClick={() => onDelete(s, label)} disabled={locked} aria-label={`Delete ${label}`}>
                                <Trash2 size={15} aria-hidden="true" />
                            </button>
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}
