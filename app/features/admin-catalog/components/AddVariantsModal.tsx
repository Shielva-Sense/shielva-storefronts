"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { OPTION_NAME_MAX } from "../constants";
import type { AddVariantsInput, AdminProduct, AttributeDef } from "../types";
import { newVariantRow, optionNameError, validateVariantRows, type RowErrors, type VariantRow } from "./form-helpers";
import { VariantRowsEditor } from "./VariantRowsEditor";
import styles from "./Catalog.module.scss";

const FORM_ID = "add-variants-form";

interface AddVariantsModalProps {
    product: AdminProduct;
    open: boolean;
    saving: boolean;
    defs: readonly AttributeDef[];
    /** Store default ("Shade" / "Size"); Shopify keeps the product's existing option name. */
    defaultOptionName: string;
    takenSkus: ReadonlySet<string>;
    onClose: () => void;
    onAdd: (input: AddVariantsInput) => void;
}

/** New shade / size on an existing product — Shopify first, then local. */
export function AddVariantsModal({ product, open, saving, defs, defaultOptionName, takenSkus, onClose, onAdd }: AddVariantsModalProps): React.JSX.Element {
    const [optionName, setOptionName] = useState(defaultOptionName);
    const [rows, setRows] = useState<VariantRow[]>(() => [newVariantRow()]);
    const [optionError, setOptionError] = useState<string | undefined>(undefined);
    const [rowErrors, setRowErrors] = useState<RowErrors>({});
    const existing = product.variants.map((v) => v.optionLabel).filter((o): o is string => Boolean(o));
    const label = optionName.trim() || defaultOptionName;

    const submit = (e: FormEvent<HTMLFormElement>): void => {
        e.preventDefault();
        const optErr = optionNameError(optionName, true) ?? undefined;
        const result = validateVariantRows(rows, { handle: product.handle, requireOption: true, defs, takenSkus });
        // An option value that already exists on the product would collide in Shopify.
        const lowerExisting = new Set(existing.map((o) => o.toLowerCase()));
        const errs: RowErrors = { ...result.rowErrors };
        for (const r of rows) {
            if (lowerExisting.has(r.option.trim().toLowerCase())) errs[r.rowId] = { ...errs[r.rowId], option: `“${r.option.trim()}” already exists on this product.` };
        }
        setOptionError(optErr);
        setRowErrors(errs);
        if (optErr || Object.keys(errs).length > 0) return;
        onAdd({ optionName: optionName.trim(), variants: result.variants });
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            size="lg"
            title={`Add to ${product.title}`}
            description={existing.length > 0 ? `Existing: ${existing.join(", ")}. New variants are created in Shopify, then appear here.` : "New variants are created in Shopify, then appear here."}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" form={FORM_ID} disabled={saving}>Add in Shopify</Button>
                </>
            }
        >
            <form id={FORM_ID} className={styles.form} onSubmit={submit} noValidate>
                <Field label="Option name" required help="Must match the product's option in Shopify (e.g. Shade, Size)." error={optionError}>
                    {(id, describedBy) => (
                        <Input id={id} value={optionName} maxLength={OPTION_NAME_MAX} aria-required="true" aria-invalid={optionError ? true : undefined} aria-describedby={describedBy} onChange={(e) => setOptionName(e.target.value)} />
                    )}
                </Field>
                <VariantRowsEditor rows={rows} onChange={setRows} handle={product.handle} multi optionLabel={label} defs={defs} errors={rowErrors} minRows={1} />
            </form>
        </Modal>
    );
}
