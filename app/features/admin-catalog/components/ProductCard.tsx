"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { centsToInput, dollarsToCents, formatCents } from "@/core/formatters";
import { Palette, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Field, Select } from "@/components/ui/Field";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { HEX_RE, KIND_LABELS, KIND_TONES, LOW_STOCK, PENDING_PREFIX, PRODUCT_STATUSES, STATUS_TONES } from "../constants";
import type { AdminProduct, AttributeDef, ProductStatus, Variant, VariantPatch } from "../types";
import { InlineNumber } from "./InlineNumber";
import { Swatch } from "./Swatch";
import styles from "./Catalog.module.scss";

interface ProductCardProps {
    product: AdminProduct;
    canEdit: boolean;
    onStatus: (status: ProductStatus) => void;
    onEdit: () => void;
    onVariant: (variant: Variant, patch: VariantPatch) => void;
    /** Store's variant presentation attributes; the Appearance column only shows when there are some. */
    variantDefs: readonly AttributeDef[];
    onAddVariants: () => void;
    onAppearance: (variant: Variant) => void;
}

const isPending = (id: string): boolean => id.startsWith(PENDING_PREFIX);

function variantColumns(canEdit: boolean, onVariant: ProductCardProps["onVariant"], appearance: ((v: Variant) => void) | null): ColumnDef<Variant, unknown>[] {
    const columns: ColumnDef<Variant, unknown>[] = [
        {
            id: "variant",
            header: "Variant",
            cell: ({ row }) => {
                const swatch = row.original.attributes.swatch;
                return (
                    <span className={styles.variantName}>
                        {swatch && HEX_RE.test(swatch) ? <Swatch color={swatch} /> : null}
                        <span>
                            {row.original.optionLabel ?? "Default"}
                            <br />
                            <span className={styles.sku}>{row.original.sku}</span>
                        </span>
                    </span>
                );
            },
        },
        {
            id: "price",
            header: "Price ($)",
            cell: ({ row }) => {
                const v = row.original;
                const value = centsToInput(v.priceCents);
                return (
                    <InlineNumber
                        key={value}
                        label={`Price for ${v.sku}`}
                        value={value}
                        step="0.01"
                        disabled={!canEdit || isPending(v.id)}
                        onCommit={(next) => {
                            const cents = dollarsToCents(next);
                            if (cents !== null) onVariant(v, { priceCents: cents });
                        }}
                    />
                );
            },
        },
        {
            id: "compare",
            header: "Compare-at ($)",
            cell: ({ row }) => {
                const v = row.original;
                const value = centsToInput(v.compareAtCents);
                return (
                    <InlineNumber
                        key={value}
                        label={`Compare-at price for ${v.sku}`}
                        value={value}
                        step="0.01"
                        allowEmpty
                        disabled={!canEdit || isPending(v.id)}
                        onCommit={(next) => onVariant(v, { compareAtCents: next ? dollarsToCents(next) : null })}
                    />
                );
            },
        },
        {
            id: "stock",
            header: "Stock",
            cell: ({ row }) => {
                const v = row.original;
                const value = String(v.inventoryQty);
                return (
                    <InlineNumber
                        key={value}
                        label={`Stock for ${v.sku}`}
                        value={value}
                        step="1"
                        disabled={!canEdit || isPending(v.id)}
                        onCommit={(next) => {
                            const qty = Number.parseInt(next, 10);
                            if (Number.isFinite(qty) && qty >= 0) onVariant(v, { inventoryQty: qty });
                        }}
                    />
                );
            },
        },
        {
            id: "shopify",
            header: "Shopify",
            cell: ({ row }) =>
                row.original.shopifyVariantId ? (
                    <StatusBadge tone="success">Linked to Shopify</StatusBadge>
                ) : (
                    <StatusBadge tone="warning">Not linked</StatusBadge>
                ),
        },
        {
            id: "health",
            header: "Stock status",
            cell: ({ row }) =>
                row.original.inventoryQty === 0 ? (
                    <StatusBadge tone="danger">Sold out</StatusBadge>
                ) : row.original.inventoryQty <= LOW_STOCK ? (
                    <StatusBadge tone="warning">Low stock</StatusBadge>
                ) : (
                    <span className={styles.muted}>In stock</span>
                ),
        },
    ];
    if (appearance) {
        columns.push({
            id: "appearance",
            header: "Appearance",
            cell: ({ row }) => (
                <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Palette size={14} aria-hidden="true" />}
                    disabled={!canEdit || isPending(row.original.id)}
                    aria-label={`Edit appearance of ${row.original.optionLabel ?? row.original.sku}`}
                    onClick={() => appearance(row.original)}
                >
                    Appearance
                </Button>
            ),
        });
    }
    return columns;
}

function ruleSummary(p: AdminProduct): string | null {
    if (p.kind === "bundle" && p.bundleRule) return `Pick ${p.bundleRule.pick} of ${p.bundleRule.eligibleSkus.length} SKUs for ${formatCents(p.bundleRule.priceCents)}`;
    if (p.kind === "membership" && p.membershipRule) return `Renews every ${p.membershipRule.intervalDays} days · ${p.membershipRule.perks.length} perks`;
    return null;
}

/** One product with its variants; price / compare-at / stock edit inline (optimistic, pushed to Shopify when linked). */
export function ProductCard({ product, canEdit: canEditRole, onStatus, onEdit, onVariant, variantDefs, onAddVariants, onAppearance }: ProductCardProps): React.JSX.Element {
    const headingId = `product-${product.id}`;
    const rule = ruleSummary(product);
    const pending = isPending(product.id);
    const canEdit = canEditRole && !pending;
    const canAddVariants = product.kind === "standard";
    return (
        <article className={styles.product} aria-labelledby={headingId}>
            <header className={styles.productHead}>
                <div className={styles.productTitle}>
                    <h2 id={headingId}>{product.title}</h2>
                    <StatusBadge tone={KIND_TONES[product.kind]} dot={false}>{KIND_LABELS[product.kind]}</StatusBadge>
                    <StatusBadge tone={STATUS_TONES[product.status]}>{PRODUCT_STATUSES.find((s) => s.value === product.status)?.label ?? product.status}</StatusBadge>
                    <span className={styles.handle}>/{product.handle}</span>
                    {pending ? <StatusBadge tone="info">Creating in Shopify…</StatusBadge> : null}
                    {product.tags.length > 0 ? (
                        <ul className={styles.chips} aria-label={`Tags of ${product.title}`}>
                            {product.tags.map((t) => (
                                <li key={t} className={styles.chip}>{t}</li>
                            ))}
                        </ul>
                    ) : null}
                </div>
                <div className={styles.productActions}>
                    <div className={styles.statusSelect}>
                        <Field label={`Status of ${product.title}`} hideLabel>
                            {(id) => (
                                <Select id={id} value={product.status} disabled={!canEdit} onChange={(e) => onStatus(e.target.value as ProductStatus)}>
                                    {PRODUCT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                                </Select>
                            )}
                        </Field>
                    </div>
                    <Button variant="secondary" size="sm" leftIcon={<Pencil size={14} aria-hidden="true" />} disabled={!canEdit} onClick={onEdit}>
                        Edit
                    </Button>
                    {canAddVariants ? (
                        <Button variant="secondary" size="sm" leftIcon={<Plus size={14} aria-hidden="true" />} disabled={!canEdit || !product.shopifyProductId} onClick={onAddVariants}>
                            Add variant
                        </Button>
                    ) : null}
                </div>
            </header>
            {rule ? <p className={styles.rule}>{rule}</p> : null}
            {canAddVariants && !pending && !product.shopifyProductId ? <p className={styles.rule}>Not linked to Shopify yet — run “Sync from Shopify” before adding variants.</p> : null}
            {product.variants.length > 0 ? (
                <DataTable columns={variantColumns(canEdit, onVariant, variantDefs.length > 0 ? onAppearance : null)} data={product.variants} getRowId={(v) => v.id} caption={`Variants of ${product.title}`} />
            ) : (
                <p className={styles.muted}>No variants. Import a Shopify CSV or run a sync to add them.</p>
            )}
        </article>
    );
}
