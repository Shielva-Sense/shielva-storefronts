"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { OPTION_MAX, SKU_MAX, VARIANTS_MAX } from "../constants";
import type { AttributeDef } from "../types";
import { AttributeFields } from "./AttributeFields";
import { newVariantRow, rowSku, type RowErrors, type VariantRow } from "./form-helpers";
import styles from "./Catalog.module.scss";

interface VariantRowsEditorProps {
    rows: readonly VariantRow[];
    onChange: (next: VariantRow[]) => void;
    /** Used for SKU suggestions (`handle:option-slug`, or `handle` for a single variant). */
    handle: string;
    /** Several variants (or adding to an existing product): option values are required. */
    multi: boolean;
    /** e.g. "Shade" / "Size" — labels the option-value input. */
    optionLabel: string;
    defs: readonly AttributeDef[];
    errors: RowErrors;
    /** Rows that can't be removed (1 when creating — a product needs a variant). */
    minRows: number;
}

/** One fieldset per variant: option value, SKU, price, compare-at, stock + the store's variant attributes. */
export function VariantRowsEditor({ rows, onChange, handle, multi, optionLabel, defs, errors, minRows }: VariantRowsEditorProps): React.JSX.Element {
    const patch = (rowId: string, next: Partial<VariantRow>): void => onChange(rows.map((r) => (r.rowId === rowId ? { ...r, ...next } : r)));

    return (
        <div className={styles.rows}>
            {rows.map((row, index) => {
                const e = errors[row.rowId] ?? {};
                const sku = rowSku(row, handle, multi);
                const name = row.option.trim() || `${multi ? optionLabel : "Variant"} ${index + 1}`;
                return (
                    <fieldset key={row.rowId} className={styles.fieldset}>
                        <legend className={styles.legend}>{name}</legend>
                        <div className={styles.formGrid}>
                            {multi ? (
                                <Field label={`${optionLabel} value`} required error={e.option}>
                                    {(id, describedBy) => (
                                        <Input id={id} value={row.option} maxLength={OPTION_MAX} aria-required="true" aria-invalid={e.option ? true : undefined} aria-describedby={describedBy} onChange={(ev) => patch(row.rowId, { option: ev.target.value })} />
                                    )}
                                </Field>
                            ) : null}
                            <Field label="SKU" required help={row.sku === null ? "Suggested from the handle — type to override." : undefined} error={e.sku}>
                                {(id, describedBy) => (
                                    <Input
                                        id={id}
                                        className={styles.mono}
                                        value={sku}
                                        maxLength={SKU_MAX}
                                        spellCheck={false}
                                        aria-required="true"
                                        aria-invalid={e.sku ? true : undefined}
                                        aria-describedby={describedBy}
                                        onChange={(ev) => patch(row.rowId, { sku: ev.target.value })}
                                    />
                                )}
                            </Field>
                            <Field label="Price ($)" required error={e.price}>
                                {(id, describedBy) => (
                                    <Input id={id} type="number" min={0} step="0.01" inputMode="decimal" value={row.price} aria-required="true" aria-invalid={e.price ? true : undefined} aria-describedby={describedBy} onChange={(ev) => patch(row.rowId, { price: ev.target.value })} />
                                )}
                            </Field>
                            <Field label="Compare-at ($)" help="Optional — shown struck through." error={e.compareAt}>
                                {(id, describedBy) => (
                                    <Input id={id} type="number" min={0} step="0.01" inputMode="decimal" value={row.compareAt} aria-invalid={e.compareAt ? true : undefined} aria-describedby={describedBy} onChange={(ev) => patch(row.rowId, { compareAt: ev.target.value })} />
                                )}
                            </Field>
                            <Field label="Stock" error={e.stock}>
                                {(id, describedBy) => (
                                    <Input id={id} type="number" min={0} step={1} inputMode="numeric" value={row.stock} aria-invalid={e.stock ? true : undefined} aria-describedby={describedBy} onChange={(ev) => patch(row.rowId, { stock: ev.target.value })} />
                                )}
                            </Field>
                        </div>
                        <AttributeFields defs={defs} value={row.attributes} onChange={(attributes) => patch(row.rowId, { attributes })} />
                        {e.attributes ? <p className={styles.error} role="alert">{e.attributes}</p> : null}
                        {rows.length > minRows ? (
                            <div className={styles.rowActions}>
                                <Button variant="ghost" size="sm" leftIcon={<Trash2 size={14} aria-hidden="true" />} onClick={() => onChange(rows.filter((r) => r.rowId !== row.rowId))}>
                                    Remove {name}
                                </Button>
                            </div>
                        ) : null}
                    </fieldset>
                );
            })}
            <div>
                <Button variant="secondary" size="sm" leftIcon={<Plus size={14} aria-hidden="true" />} disabled={rows.length >= VARIANTS_MAX} onClick={() => onChange([...rows, newVariantRow()])}>
                    Add {multi ? optionLabel.toLowerCase() : "variant"}
                </Button>
            </div>
        </div>
    );
}
