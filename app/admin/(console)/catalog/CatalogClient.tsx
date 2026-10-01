"use client";

import { useMemo, useState } from "react";
import { FileUp, PackageOpen, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { BrandSpinner, ProgressOverlay } from "@/components/ui/ProgressOverlay";
import { StatSection } from "@/components/ui/StatSection";
import { ListLayout } from "@/components/layouts/ListLayout";
import { formatNumber } from "@/core/formatters";
import { useAdmin } from "@/features/admin-session/AdminContext";
import { LoadError, PanelNote } from "@/components/ui/Panel";
import { AddVariantsModal } from "@/features/admin-catalog/components/AddVariantsModal";
import { ImportModal } from "@/features/admin-catalog/components/ImportModal";
import { ProductCreateModal } from "@/features/admin-catalog/components/ProductCreateModal";
import { VariantAppearanceModal } from "@/features/admin-catalog/components/VariantAppearanceModal";
import { ProductCard } from "@/features/admin-catalog/components/ProductCard";
import { ProductEditModal } from "@/features/admin-catalog/components/ProductEditModal";
import { LOW_STOCK, OPTION_NAME_DEFAULTS, OPTION_NAME_FALLBACK } from "@/features/admin-catalog/constants";
import { useAddVariants, useCatalogImport, useCatalogSchema, useCatalogSync, useCreateProduct, useProducts, useUpdateProduct, useUpdateVariant } from "@/features/admin-catalog/hooks";
import type { AdminProduct, CatalogSchema } from "@/features/admin-catalog/types";
import styles from "@/features/admin-catalog/components/Catalog.module.scss";

function catalogStats(items: readonly AdminProduct[]): { label: string; value: string; hint: string; tone?: "warning" | "success" | "neutral" }[] {
    const variants = items.flatMap((p) => p.variants);
    const linked = variants.filter((v) => v.shopifyVariantId).length;
    const low = variants.filter((v) => v.inventoryQty <= LOW_STOCK).length;
    return [
        { label: "Products", value: formatNumber(items.length), hint: `${formatNumber(items.filter((p) => p.status === "active").length)} active on the storefront` },
        { label: "Variants", value: formatNumber(variants.length), hint: "Sellable SKUs" },
        { label: "Linked to Shopify", value: `${formatNumber(linked)} / ${formatNumber(variants.length)}`, hint: "Price & stock edits push to Shopify", tone: linked === variants.length ? "success" : "warning" },
        { label: "Low or sold out", value: formatNumber(low), hint: `${LOW_STOCK} units or fewer`, tone: low > 0 ? "warning" : "neutral" },
    ];
}

const EMPTY_SCHEMA: CatalogSchema = { productAttributes: [], variantAttributes: [], tags: [] };

export function CatalogClient(): React.JSX.Element {
    const { tenant, can } = useAdmin();
    const canEdit = can("admin");
    const products = useProducts(tenant);
    const updateProduct = useUpdateProduct(tenant);
    const updateVariant = useUpdateVariant(tenant);
    const sync = useCatalogSync(tenant);
    const importer = useCatalogImport(tenant);
    const schemaQuery = useCatalogSchema(tenant);
    const createProduct = useCreateProduct(tenant);
    const addVariants = useAddVariants(tenant);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [createKey, setCreateKey] = useState(0);
    const [addingToId, setAddingToId] = useState<string | null>(null);
    const [appearance, setAppearance] = useState<{ productId: string; variantId: string } | null>(null);
    const [importOpen, setImportOpen] = useState(false);
    const [importKey, setImportKey] = useState(0);

    const items = products.data?.items ?? [];
    const editing = items.find((p) => p.id === editingId) ?? null;
    const addingTo = items.find((p) => p.id === addingToId) ?? null;
    const appearanceProduct = appearance ? (items.find((p) => p.id === appearance.productId) ?? null) : null;
    const appearanceVariant = appearanceProduct?.variants.find((v) => v.id === appearance?.variantId) ?? null;
    const schema = schemaQuery.data ?? EMPTY_SCHEMA;
    const optionLabel = OPTION_NAME_DEFAULTS[tenant] ?? OPTION_NAME_FALLBACK;
    const data = products.data;
    const takenSkus = useMemo(() => new Set((data?.items ?? []).flatMap((p) => p.variants.map((v) => v.sku.toLowerCase()))), [data]);
    const takenHandles = useMemo(() => new Set((data?.items ?? []).map((p) => p.handle)), [data]);

    return (
        <ListLayout
            title="Catalogue"
            subtitle="Products are created in Shopify (its checkout charges them) and appear here and on the storefront by tag. Appearance fields (swatch, silhouette…) are ours."
            headerActions={
                <>
                    <Button variant="secondary" leftIcon={<FileUp size={14} aria-hidden="true" />} disabled={!canEdit} onClick={() => setImportOpen(true)}>
                        Import Shopify CSV
                    </Button>
                    <Button variant="secondary" leftIcon={<RefreshCw size={14} aria-hidden="true" />} disabled={!canEdit || sync.isPending} onClick={() => sync.mutate()}>
                        Sync from Shopify
                    </Button>
                    <Button leftIcon={<Plus size={14} aria-hidden="true" />} disabled={!canEdit || !schemaQuery.isSuccess} onClick={() => setCreateOpen(true)}>
                        New product
                    </Button>
                </>
            }
            stats={<StatSection stats={catalogStats(items)} show={products.isSuccess && items.length > 0} />}
            aboveContent={
                !canEdit ? (
                    <PanelNote>You have view-only access. Catalogue edits, imports and syncs need the admin role.</PanelNote>
                ) : schemaQuery.isError ? (
                    <LoadError message={`Couldn't load this store's product fields, so “New product” is unavailable: ${schemaQuery.error.message}`} onRetry={() => void schemaQuery.refetch()} />
                ) : null
            }
        >
            {products.isPending ? <BrandSpinner mode="content" message="Loading the catalogue…" /> : null}
            {products.isError ? <LoadError message={`Couldn't load the catalogue: ${products.error.message}`} onRetry={() => void products.refetch()} /> : null}
            {products.isSuccess && items.length === 0 ? (
                <EmptyState
                    icon={<PackageOpen size={32} aria-hidden="true" />}
                    title="The catalogue is empty"
                    description="Bring products in from Shopify: “Sync from Shopify” pulls every variant and links it by SKU, or import Shopify's product export CSV to add titles, descriptions, SEO fields and images first."
                    action={canEdit ? <Button leftIcon={<RefreshCw size={14} aria-hidden="true" />} onClick={() => sync.mutate()}>Sync from Shopify</Button> : undefined}
                />
            ) : null}
            {items.length > 0 ? (
                <ul className={styles.list}>
                    {items.map((p) => (
                        <li key={p.id}>
                            <ProductCard
                                product={p}
                                canEdit={canEdit}
                                onStatus={(status) => updateProduct.mutate({ id: p.id, patch: { status } })}
                                onEdit={() => setEditingId(p.id)}
                                onVariant={(v, patch) => updateVariant.mutate({ id: v.id, sku: v.sku, patch })}
                                variantDefs={schema.variantAttributes}
                                onAddVariants={() => setAddingToId(p.id)}
                                onAppearance={(v) => setAppearance({ productId: p.id, variantId: v.id })}
                            />
                        </li>
                    ))}
                </ul>
            ) : null}

            {editing ? (
                <ProductEditModal
                    key={`${editing.id}-${editing.updatedAt}`}
                    product={editing}
                    schema={schema}
                    open
                    saving={updateProduct.isPending}
                    onClose={() => setEditingId(null)}
                    onSave={(patch) => updateProduct.mutate({ id: editing.id, patch }, { onSuccess: () => setEditingId(null) })}
                />
            ) : null}
            {canEdit && schemaQuery.isSuccess ? (
                <ProductCreateModal
                    key={`create-${createKey}`}
                    open={createOpen}
                    saving={createProduct.isPending}
                    schema={schema}
                    optionLabel={optionLabel}
                    takenSkus={takenSkus}
                    takenHandles={takenHandles}
                    onClose={() => setCreateOpen(false)}
                    onCreate={(input) =>
                        createProduct.mutate(input, {
                            onSuccess: () => {
                                setCreateOpen(false);
                                setCreateKey((k) => k + 1);
                            },
                        })
                    }
                />
            ) : null}
            {addingTo ? (
                <AddVariantsModal
                    key={addingTo.id}
                    product={addingTo}
                    open
                    saving={addVariants.isPending}
                    defs={schema.variantAttributes}
                    defaultOptionName={optionLabel}
                    takenSkus={takenSkus}
                    onClose={() => setAddingToId(null)}
                    onAdd={(input) => addVariants.mutate({ productId: addingTo.id, input }, { onSuccess: () => setAddingToId(null) })}
                />
            ) : null}
            {appearanceProduct && appearanceVariant ? (
                <VariantAppearanceModal
                    key={`${appearanceVariant.id}-${appearanceVariant.updatedAt}`}
                    variant={appearanceVariant}
                    productTitle={appearanceProduct.title}
                    open
                    saving={updateVariant.isPending}
                    defs={schema.variantAttributes}
                    onClose={() => setAppearance(null)}
                    onSave={(attributes) => updateVariant.mutate({ id: appearanceVariant.id, sku: appearanceVariant.sku, patch: { attributes } }, { onSuccess: () => setAppearance(null) })}
                />
            ) : null}
            <ImportModal
                key={`import-${importKey}`}
                open={importOpen}
                pending={importer.isPending}
                onClose={() => setImportOpen(false)}
                onImport={(csv) =>
                    importer.mutate(csv, {
                        onSuccess: () => {
                            setImportOpen(false);
                            setImportKey((k) => k + 1);
                        },
                    })
                }
            />
            <ProgressOverlay open={sync.isPending} message="Syncing the catalogue from Shopify…" detail="Linking variants by SKU and refreshing price and stock." />
            <ProgressOverlay open={importer.isPending} message="Importing the Shopify CSV…" />
            <ProgressOverlay open={updateProduct.isPending && editing !== null} message="Saving the product…" />
            <ProgressOverlay open={createProduct.isPending} message="Creating the product in Shopify…" detail="Shopify creates the product and its variants first, then it is added to this catalogue." />
            <ProgressOverlay open={addVariants.isPending} message="Adding the variants in Shopify…" />
            <ProgressOverlay open={updateVariant.isPending && appearance !== null} message="Saving the appearance…" />
        </ListLayout>
    );
}
