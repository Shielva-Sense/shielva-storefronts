"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { AttributeDef, Attributes, Variant } from "../types";
import { AttributeFields } from "./AttributeFields";
import { attributeError, pickAttributes } from "./form-helpers";
import styles from "./Catalog.module.scss";

const FORM_ID = "variant-appearance-form";

interface VariantAppearanceModalProps {
    variant: Variant;
    productTitle: string;
    open: boolean;
    saving: boolean;
    defs: readonly AttributeDef[];
    onClose: () => void;
    onSave: (attributes: Attributes) => void;
}

/** Presentation-only fields (swatch, finish…) — stored by us, never sent to Shopify. */
export function VariantAppearanceModal({ variant, productTitle, open, saving, defs, onClose, onSave }: VariantAppearanceModalProps): React.JSX.Element {
    const [attrs, setAttrs] = useState<Attributes>(() => ({ ...variant.attributes }));
    const [error, setError] = useState<string | null>(null);

    const submit = (e: FormEvent<HTMLFormElement>): void => {
        e.preventDefault();
        const err = attributeError(defs, attrs);
        setError(err);
        if (!err) onSave(pickAttributes(defs, attrs));
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={`Appearance — ${variant.optionLabel ?? "Default"}`}
            description={`${productTitle} · ${variant.sku}. Used by the storefront to draw this variant; Shopify is not changed.`}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" form={FORM_ID} disabled={saving}>Save appearance</Button>
                </>
            }
        >
            <form id={FORM_ID} className={styles.form} onSubmit={submit} noValidate>
                <AttributeFields defs={defs} value={attrs} onChange={setAttrs} />
                {error ? <p className={styles.error} role="alert">{error}</p> : null}
            </form>
        </Modal>
    );
}
