"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { HANDLE_MAX, HANDLE_RE, MEDIA_MAX, OPTION_NAME_MAX, PRODUCT_STATUSES } from "../constants";
import type { Attributes, CatalogSchema, NewProductInput, ProductStatus } from "../types";
import { AttributeFields } from "./AttributeFields";
import { attributeError, newVariantRow, optionNameError, parseMedia, pickAttributes, slugify, validateVariantRows, type RowErrors, type VariantRow } from "./form-helpers";
import { TagsEditor } from "./TagsEditor";
import { VariantRowsEditor } from "./VariantRowsEditor";
import styles from "./Catalog.module.scss";

const FORM_ID = "product-create-form";

interface Draft {
    title: string;
    /** null = follow the title until the admin edits the handle. */
    handle: string | null;
    description: string;
    status: ProductStatus;
    tags: string[];
    attributes: Attributes;
    media: string;
    optionName: string;
    rows: VariantRow[];
}

type Errors = Partial<Record<"title" | "handle" | "media" | "attributes" | "optionName" | "variants", string>>;

interface ProductCreateModalProps {
    open: boolean;
    saving: boolean;
    schema: CatalogSchema;
    /** Default option name for this store ("Shade", "Size"). */
    optionLabel: string;
    /** SKUs and handles already in the catalogue (lower-cased) — caught before the Shopify round-trip. */
    takenSkus: ReadonlySet<string>;
    takenHandles: ReadonlySet<string>;
    onClose: () => void;
    onCreate: (input: NewProductInput) => void;
}

export function ProductCreateModal({ open, saving, schema, optionLabel, takenSkus, takenHandles, onClose, onCreate }: ProductCreateModalProps): React.JSX.Element {
    const [d, setD] = useState<Draft>(() => ({ title: "", handle: null, description: "", status: "draft", tags: [], attributes: {}, media: "", optionName: "", rows: [newVariantRow()] }));
    const [errors, setErrors] = useState<Errors>({});
    const [rowErrors, setRowErrors] = useState<RowErrors>({});
    const set = <K extends keyof Draft>(k: K, v: Draft[K]): void => setD((prev) => ({ ...prev, [k]: v }));

    const handle = d.handle ?? slugify(d.title);
    const multi = d.rows.length > 1;
    const optionName = d.optionName.trim() || optionLabel;

    const submit = (e: FormEvent<HTMLFormElement>): void => {
        e.preventDefault();
        const next: Errors = {};
        if (!d.title.trim()) next.title = "A product needs a title.";
        if (!handle) next.handle = "Set a handle (it becomes the product URL).";
        else if (handle.length > HANDLE_MAX || !HANDLE_RE.test(handle)) next.handle = "Lowercase letters and digits separated by single dashes, e.g. ruby-noir-lipstick.";
        else if (takenHandles.has(handle)) next.handle = "A product with this handle already exists.";
        const media = parseMedia(d.media);
        if (media.error) next.media = media.error;
        const attrErr = attributeError(schema.productAttributes, d.attributes);
        if (attrErr) next.attributes = attrErr;
        const optErr = multi ? optionNameError(optionName, true) : null;
        if (optErr) next.optionName = optErr;
        const rows = validateVariantRows(d.rows, { handle, requireOption: multi, defs: schema.variantAttributes, takenSkus });
        if (Object.keys(rows.rowErrors).length > 0) next.variants = "Fix the highlighted variant fields.";
        setErrors(next);
        setRowErrors(rows.rowErrors);
        if (Object.keys(next).length > 0) return;
        onCreate({
            handle,
            title: d.title.trim(),
            description: d.description,
            status: d.status,
            tags: d.tags,
            attributes: pickAttributes(schema.productAttributes, d.attributes),
            media: media.media,
            optionName: multi ? optionName : null,
            variants: rows.variants,
        });
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            size="lg"
            title="New product"
            description="Created in Shopify first (its checkout charges it), then added here. Draft products stay off the storefront until you set them to Active."
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" form={FORM_ID} disabled={saving}>Create in Shopify</Button>
                </>
            }
        >
            <form id={FORM_ID} className={styles.form} onSubmit={submit} noValidate>
                <div className={styles.formGrid}>
                    <Field label="Title" required error={errors.title}>
                        {(id, describedBy) => <Input id={id} value={d.title} maxLength={200} aria-required="true" aria-invalid={errors.title ? true : undefined} aria-describedby={describedBy} onChange={(e) => set("title", e.target.value)} />}
                    </Field>
                    <Field label="Handle" required help={d.handle === null ? "Follows the title until you edit it. Becomes the product URL." : "Becomes the product URL."} error={errors.handle}>
                        {(id, describedBy) => (
                            <Input id={id} className={styles.mono} value={handle} maxLength={HANDLE_MAX} spellCheck={false} aria-required="true" aria-invalid={errors.handle ? true : undefined} aria-describedby={describedBy} onChange={(e) => set("handle", e.target.value.toLowerCase())} />
                        )}
                    </Field>
                    <Field label="Status" help="Draft and archived products are hidden from the storefront.">
                        {(id, describedBy) => (
                            <Select id={id} value={d.status} aria-describedby={describedBy} onChange={(e) => set("status", e.target.value as ProductStatus)}>
                                {PRODUCT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </Select>
                        )}
                    </Field>
                </div>
                <Field label="Description" help="Plain text; blank lines start new paragraphs.">
                    {(id, describedBy) => <Textarea id={id} rows={4} maxLength={5000} value={d.description} aria-describedby={describedBy} onChange={(e) => set("description", e.target.value)} />}
                </Field>

                <TagsEditor tags={d.tags} known={schema.tags} onChange={(tags) => set("tags", tags)} />

                {schema.productAttributes.length > 0 ? (
                    <fieldset className={styles.fieldset}>
                        <legend className={styles.legend}>Appearance</legend>
                        <AttributeFields defs={schema.productAttributes} value={d.attributes} onChange={(attributes) => set("attributes", attributes)} />
                        {errors.attributes ? <p className={styles.error} role="alert">{errors.attributes}</p> : null}
                    </fieldset>
                ) : null}

                <Field label="Media URLs" help={`One https:// image URL per line, first is the cover (max ${MEDIA_MAX}).`} error={errors.media}>
                    {(id, describedBy) => (
                        <Textarea id={id} rows={3} className={styles.mono} value={d.media} spellCheck={false} aria-invalid={errors.media ? true : undefined} aria-describedby={describedBy} onChange={(e) => set("media", e.target.value)} />
                    )}
                </Field>

                <section className={styles.form} aria-labelledby={`${FORM_ID}-variants`}>
                    <h3 id={`${FORM_ID}-variants`} className={styles.subhead}>Variants</h3>
                    {multi ? (
                        <Field label="Option name" required help="What the variants differ by — Shopify shows it on the product." error={errors.optionName}>
                            {(id, describedBy) => (
                                <Input id={id} value={d.optionName} placeholder={optionLabel} maxLength={OPTION_NAME_MAX} aria-required="true" aria-invalid={errors.optionName ? true : undefined} aria-describedby={describedBy} onChange={(e) => set("optionName", e.target.value)} />
                            )}
                        </Field>
                    ) : (
                        <p className={styles.help}>A single variant is sold as the default. Add another to sell several {optionLabel.toLowerCase()}s.</p>
                    )}
                    <VariantRowsEditor rows={d.rows} onChange={(rows) => set("rows", rows)} handle={handle} multi={multi} optionLabel={optionName} defs={schema.variantAttributes} errors={rowErrors} minRows={1} />
                    {errors.variants ? <p className={styles.error} role="alert">{errors.variants}</p> : null}
                </section>
            </form>
        </Modal>
    );
}
