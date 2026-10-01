"use client";

import { Checkbox, Field, Input, Select } from "@/components/ui/Field";
import { HEX_RE } from "../constants";
import type { AttributeDef, Attributes } from "../types";
import { Swatch } from "./Swatch";
import styles from "./Catalog.module.scss";

const PICKER_FALLBACK = "#000000";

interface AttributeFieldsProps {
    defs: readonly AttributeDef[];
    value: Attributes;
    onChange: (next: Attributes) => void;
    disabled?: boolean;
}

function toggle(list: string, option: string, on: boolean): string {
    const parts = list.split(",").map((p) => p.trim()).filter(Boolean);
    const next = on ? [...new Set([...parts, option])] : parts.filter((p) => p !== option);
    return next.join(",");
}

/** Generic form for a store's presentation attributes (GET /admin/catalog/schema drives it). */
export function AttributeFields({ defs, value, onChange, disabled = false }: AttributeFieldsProps): React.JSX.Element | null {
    if (defs.length === 0) return null;
    const set = (key: string, v: string): void => onChange({ ...value, [key]: v });

    return (
        <div className={styles.formGrid}>
            {defs.map((def) => {
                const current = value[def.key] ?? "";
                if (def.type === "color") {
                    const valid = HEX_RE.test(current);
                    return (
                        <Field key={def.key} label={def.label} help={def.help ?? "Pick a color or type a #rrggbb hex."}>
                            {(id, describedBy) => (
                                <div className={styles.colorRow}>
                                    <Swatch color={valid ? current : null} label={valid ? `${def.label}: ${current}` : `${def.label}: not set`} size="lg" />
                                    <Input
                                        type="color"
                                        className={styles.colorPicker}
                                        aria-label={`${def.label} picker`}
                                        value={valid ? current.toLowerCase() : PICKER_FALLBACK}
                                        disabled={disabled}
                                        onChange={(e) => set(def.key, e.target.value)}
                                    />
                                    <Input
                                        id={id}
                                        className={styles.mono}
                                        value={current}
                                        placeholder="#rrggbb"
                                        maxLength={7}
                                        spellCheck={false}
                                        disabled={disabled}
                                        aria-invalid={current && !valid ? true : undefined}
                                        aria-describedby={describedBy}
                                        onChange={(e) => set(def.key, e.target.value.trim())}
                                    />
                                </div>
                            )}
                        </Field>
                    );
                }
                if (def.type === "select") {
                    return (
                        <Field key={def.key} label={def.label} help={def.help}>
                            {(id, describedBy) => (
                                <Select id={id} value={current} disabled={disabled} aria-describedby={describedBy} onChange={(e) => set(def.key, e.target.value)}>
                                    <option value="">Not set</option>
                                    {(def.options ?? []).map((o) => (
                                        <option key={o} value={o}>{o}</option>
                                    ))}
                                </Select>
                            )}
                        </Field>
                    );
                }
                if (def.type === "multiselect") {
                    const selected = new Set(current.split(",").map((p) => p.trim()).filter(Boolean));
                    return (
                        <fieldset key={def.key} className={styles.checkGroup}>
                            <legend className={styles.legend}>{def.label}</legend>
                            <div className={styles.checkOptions}>
                                {(def.options ?? []).map((o) => (
                                    <Checkbox key={o} label={o} checked={selected.has(o)} disabled={disabled} onChange={(on) => set(def.key, toggle(current, o, on))} />
                                ))}
                            </div>
                            {def.help ? <p className={styles.help}>{def.help}</p> : null}
                        </fieldset>
                    );
                }
                return (
                    <Field key={def.key} label={def.label} help={def.help}>
                        {(id, describedBy) => <Input id={id} value={current} maxLength={120} disabled={disabled} aria-describedby={describedBy} onChange={(e) => set(def.key, e.target.value)} />}
                    </Field>
                );
            })}
        </div>
    );
}
