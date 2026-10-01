"use client";

import { useState, type FormEvent } from "react";
import { centsToInput, dollarsToCents } from "@/core/formatters";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { KIND_LABELS, MEDIA_MAX, PRODUCT_STATUSES, SEO_DESCRIPTION_MAX, SEO_TITLE_MAX } from "../constants";
import type { AdminProduct, Attributes, CatalogSchema, ProductPatch, ProductStatus } from "../types";
import { AttributeFields } from "./AttributeFields";
import { attributeError, parseMedia, pickAttributes } from "./form-helpers";
import { TagsEditor } from "./TagsEditor";
import styles from "./Catalog.module.scss";

const FORM_ID = "product-edit-form";

interface Draft {
    title: string;
    description: string;
    status: ProductStatus;
    tags: string[];
    attributes: Attributes;
    seoTitle: string;
    seoDescription: string;
    media: string;
    bundlePick: string;
    bundlePrice: string;
    bundleSkus: string;
    membershipInterval: string;
    membershipPerks: string;
}

type Errors = Partial<Record<"title" | "media" | "attributes" | "bundle" | "membership", string>>;

function toDraft(p: AdminProduct): Draft {
    return {
        title: p.title,
        description: p.description,
        status: p.status,
        tags: [...p.tags],
        attributes: { ...p.attributes },
        seoTitle: p.seoTitle ?? "",
        seoDescription: p.seoDescription ?? "",
        media: p.media.join("\n"),
        bundlePick: p.bundleRule ? String(p.bundleRule.pick) : "3",
        bundlePrice: p.bundleRule ? centsToInput(p.bundleRule.priceCents) : "",
        bundleSkus: p.bundleRule ? p.bundleRule.eligibleSkus.join("\n") : "",
        membershipInterval: p.membershipRule ? String(p.membershipRule.intervalDays) : "30",
        membershipPerks: p.membershipRule ? p.membershipRule.perks.join("\n") : "",
    };
}

const lines = (text: string): string[] => text.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);

function buildPatch(p: AdminProduct, d: Draft, schema: CatalogSchema): { patch: ProductPatch; errors: Errors } {
    const errors: Errors = {};
    if (!d.title.trim()) errors.title = "A product needs a title.";
    const { media, error: mediaError } = parseMedia(d.media);
    if (mediaError) errors.media = mediaError;
    const attrError = attributeError(schema.productAttributes, d.attributes);
    if (attrError) errors.attributes = attrError;

    const patch: ProductPatch = {
        title: d.title.trim(),
        description: d.description,
        status: d.status,
        tags: d.tags,
        attributes: pickAttributes(schema.productAttributes, d.attributes),
        seoTitle: d.seoTitle.trim() || null,
        seoDescription: d.seoDescription.trim() || null,
        media,
    };
    if (p.kind === "bundle") {
        const pick = Number.parseInt(d.bundlePick, 10);
        const priceCents = dollarsToCents(d.bundlePrice);
        const eligibleSkus = lines(d.bundleSkus);
        if (!(pick >= 2 && pick <= 10)) errors.bundle = "Pick must be between 2 and 10 items.";
        else if (priceCents === null || priceCents < 1) errors.bundle = "Set the bundle price.";
        else if (eligibleSkus.length < 2) errors.bundle = "List at least two eligible SKUs.";
        else patch.bundleRule = { pick, priceCents, eligibleSkus };
    }
    if (p.kind === "membership") {
        const intervalDays = Number.parseInt(d.membershipInterval, 10);
        const perks = lines(d.membershipPerks);
        if (!(intervalDays >= 1 && intervalDays <= 366)) errors.membership = "Billing interval must be 1–366 days.";
        else if (perks.length > 10) errors.membership = "At most 10 perks.";
        else patch.membershipRule = { intervalDays, perks };
    }
    return { patch, errors };
}

interface ProductEditModalProps {
    product: AdminProduct;
    schema: CatalogSchema;
    open: boolean;
    saving: boolean;
    onClose: () => void;
    onSave: (patch: ProductPatch) => void;
}

export function ProductEditModal({ product, schema, open, saving, onClose, onSave }: ProductEditModalProps): React.JSX.Element {
    const [d, setD] = useState<Draft>(() => toDraft(product));
    const [errors, setErrors] = useState<Errors>({});
    const set = <K extends keyof Draft>(k: K, v: Draft[K]): void => setD((prev) => ({ ...prev, [k]: v }));
    const err = (k: keyof Errors): { error?: string } => {
        const message = errors[k];
        return message ? { error: message } : {};
    };

    const submit = (e: FormEvent<HTMLFormElement>): void => {
        e.preventDefault();
        const { patch, errors: next } = buildPatch(product, d, schema);
        setErrors(next);
        if (Object.keys(next).length === 0) onSave(patch);
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            size="lg"
            title={`Edit ${product.title}`}
            description={`${KIND_LABELS[product.kind]} · /${product.handle}. Price and stock are edited per variant in the catalogue table.`}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" form={FORM_ID} disabled={saving}>Save product</Button>
                </>
            }
        >
            <form id={FORM_ID} className={styles.form} onSubmit={submit} noValidate>
                <div className={styles.formGrid}>
                    <Field label="Title" required {...err("title")}>
                        {(id, describedBy) => <Input id={id} value={d.title} maxLength={200} onChange={(e) => set("title", e.target.value)} aria-required="true" aria-invalid={errors.title ? true : undefined} aria-describedby={describedBy} />}
                    </Field>
                    <Field label="Status" help="Draft and archived products are hidden from the storefront.">
                        {(id, describedBy) => (
                            <Select id={id} value={d.status} onChange={(e) => set("status", e.target.value as ProductStatus)} aria-describedby={describedBy}>
                                {PRODUCT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </Select>
                        )}
                    </Field>
                </div>
                <Field label="Description">
                    {(id) => <Textarea id={id} rows={4} maxLength={5000} value={d.description} onChange={(e) => set("description", e.target.value)} />}
                </Field>
                <TagsEditor tags={d.tags} known={schema.tags} onChange={(tags) => set("tags", tags)} />
                {schema.productAttributes.length > 0 ? (
                    <fieldset className={styles.fieldset}>
                        <legend className={styles.legend}>Appearance</legend>
                        <AttributeFields defs={schema.productAttributes} value={d.attributes} onChange={(attributes) => set("attributes", attributes)} />
                        {errors.attributes ? <p className={styles.error} role="alert">{errors.attributes}</p> : null}
                    </fieldset>
                ) : null}
                <Field label="SEO title" help={`${d.seoTitle.length}/${SEO_TITLE_MAX} — shown as the search result headline. Blank uses the product title.`}>
                    {(id, describedBy) => <Input id={id} value={d.seoTitle} maxLength={SEO_TITLE_MAX} onChange={(e) => set("seoTitle", e.target.value)} aria-describedby={describedBy} />}
                </Field>
                <Field label="SEO description" help={`${d.seoDescription.length}/${SEO_DESCRIPTION_MAX} — the snippet under the search result.`}>
                    {(id, describedBy) => <Textarea id={id} rows={3} value={d.seoDescription} maxLength={SEO_DESCRIPTION_MAX} onChange={(e) => set("seoDescription", e.target.value)} aria-describedby={describedBy} />}
                </Field>
                <Field label="Media URLs" help={`One https:// image URL per line, first is the cover (max ${MEDIA_MAX}).`} {...err("media")}>
                    {(id, describedBy) => (
                        <Textarea id={id} rows={4} className={styles.mono} value={d.media} onChange={(e) => set("media", e.target.value)} aria-invalid={errors.media ? true : undefined} aria-describedby={describedBy} spellCheck={false} />
                    )}
                </Field>

                {product.kind === "bundle" ? (
                    <fieldset className={styles.fieldset}>
                        <legend className={styles.legend}>Bundle rule</legend>
                        <div className={styles.formGrid}>
                            <Field label="Pick (items)" help="How many items the shopper chooses">
                                {(id, describedBy) => <Input id={id} type="number" min={2} max={10} step={1} value={d.bundlePick} onChange={(e) => set("bundlePick", e.target.value)} aria-describedby={describedBy} />}
                            </Field>
                            <Field label="Bundle price ($)" help="Fixed price for the set">
                                {(id, describedBy) => <Input id={id} type="number" min="0.01" step="0.01" inputMode="decimal" value={d.bundlePrice} onChange={(e) => set("bundlePrice", e.target.value)} aria-describedby={describedBy} />}
                            </Field>
                        </div>
                        <Field label="Eligible SKUs" help="One SKU per line (or comma-separated)." {...err("bundle")}>
                            {(id, describedBy) => <Textarea id={id} rows={4} className={styles.mono} value={d.bundleSkus} onChange={(e) => set("bundleSkus", e.target.value)} aria-invalid={errors.bundle ? true : undefined} aria-describedby={describedBy} spellCheck={false} />}
                        </Field>
                    </fieldset>
                ) : null}

                {product.kind === "membership" ? (
                    <fieldset className={styles.fieldset}>
                        <legend className={styles.legend}>Membership rule</legend>
                        <Field label="Billing interval (days)" help="A new period starts every N days">
                            {(id, describedBy) => <Input id={id} type="number" min={1} max={366} step={1} value={d.membershipInterval} onChange={(e) => set("membershipInterval", e.target.value)} aria-describedby={describedBy} />}
                        </Field>
                        <Field label="Perks" help="One perk per line (max 10) — listed on the storefront." {...err("membership")}>
                            {(id, describedBy) => <Textarea id={id} rows={4} value={d.membershipPerks} onChange={(e) => set("membershipPerks", e.target.value)} aria-invalid={errors.membership ? true : undefined} aria-describedby={describedBy} />}
                        </Field>
                    </fieldset>
                ) : null}
            </form>
        </Modal>
    );
}
