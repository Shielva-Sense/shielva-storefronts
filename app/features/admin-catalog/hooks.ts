"use client";

import { useMutation, useQuery, useQueryClient, type UseMutationResult, type UseQueryResult } from "@tanstack/react-query";
import { toast } from "@/components/ui/Toast";
import type { ApiError } from "@/core/api-client";
import { queryKeys } from "@/core/query-keys";
import { addVariants, createProduct, fetchCatalogSchema, fetchProducts, importCatalogCsv, syncCatalog, updateProduct, updateVariant } from "./api";
import { PENDING_PREFIX } from "./constants";
import type {
    AddVariantsInput,
    AddVariantsResult,
    AdminProduct,
    CatalogSchema,
    ImportResult,
    NewProductInput,
    NewVariantInput,
    ProductPatch,
    ProductPatchResult,
    ProductsResponse,
    SyncResult,
    Variant,
    VariantPatch,
    VariantPatchResult,
} from "./types";

export function useProducts(tenant: string): UseQueryResult<ProductsResponse, ApiError> {
    return useQuery<ProductsResponse, ApiError>({ queryKey: queryKeys.admin.products(tenant), queryFn: () => fetchProducts(tenant) });
}

/** Per-store attribute + tag definitions; static per deploy, so the default stale time is plenty. */
export function useCatalogSchema(tenant: string): UseQueryResult<CatalogSchema, ApiError> {
    return useQuery<CatalogSchema, ApiError>({ queryKey: queryKeys.admin.catalogSchema(tenant), queryFn: () => fetchCatalogSchema(tenant) });
}

interface Snapshot {
    prev: ProductsResponse | undefined;
}

/** Placeholder variant shown while Shopify creates the real one. */
function pendingVariant(productId: string, v: NewVariantInput, position: number, now: string): Variant {
    return {
        id: `${PENDING_PREFIX}${productId}-${v.sku}`,
        productId,
        sku: v.sku,
        optionLabel: v.option,
        priceCents: v.priceCents,
        compareAtCents: v.compareAtCents,
        inventoryQty: v.inventoryQty,
        inventoryItemId: null,
        shopifyVariantId: null,
        position,
        attributes: v.attributes,
        updatedAt: now,
    };
}

export function useCreateProduct(tenant: string): UseMutationResult<Omit<AdminProduct, "variants">, ApiError, NewProductInput, Snapshot> {
    const qc = useQueryClient();
    const key = queryKeys.admin.products(tenant);
    return useMutation<Omit<AdminProduct, "variants">, ApiError, NewProductInput, Snapshot>({
        mutationFn: (input) => createProduct(tenant, input),
        onMutate: async (input) => {
            await qc.cancelQueries({ queryKey: key });
            const prev = qc.getQueryData<ProductsResponse>(key);
            const now = new Date().toISOString();
            const id = `${PENDING_PREFIX}${input.handle}`;
            const pending: AdminProduct = {
                id,
                handle: input.handle,
                title: input.title,
                description: input.description,
                kind: "standard",
                status: input.status,
                tags: input.tags,
                attributes: input.attributes,
                position: 0,
                media: input.media,
                shopifyProductId: null,
                seoTitle: null,
                seoDescription: null,
                bundleRule: null,
                membershipRule: null,
                createdAt: now,
                updatedAt: now,
                variants: input.variants.map((v, i) => pendingVariant(id, v, i, now)),
            };
            qc.setQueryData<ProductsResponse>(key, (old) => (old ? { items: [pending, ...old.items] } : old));
            return { prev };
        },
        onError: (err, _vars, ctx) => {
            if (ctx?.prev) qc.setQueryData<ProductsResponse>(key, ctx.prev);
            toast.error(`Couldn't create the product: ${err.message}`);
        },
        onSuccess: (p) => toast.success(`Created “${p.title}” in Shopify. ${p.status === "active" ? "It appears on the storefront in a moment." : "Set it to Active to show it on the storefront."}`),
        onSettled: () => void qc.invalidateQueries({ queryKey: key }),
    });
}

export function useAddVariants(tenant: string): UseMutationResult<AddVariantsResult, ApiError, { productId: string; input: AddVariantsInput }, Snapshot> {
    const qc = useQueryClient();
    const key = queryKeys.admin.products(tenant);
    return useMutation<AddVariantsResult, ApiError, { productId: string; input: AddVariantsInput }, Snapshot>({
        mutationFn: ({ productId, input }) => addVariants(tenant, productId, input),
        onMutate: async ({ productId, input }) => {
            await qc.cancelQueries({ queryKey: key });
            const prev = qc.getQueryData<ProductsResponse>(key);
            const now = new Date().toISOString();
            qc.setQueryData<ProductsResponse>(key, (old) =>
                old
                    ? {
                          items: old.items.map((p) =>
                              p.id === productId ? { ...p, variants: [...p.variants, ...input.variants.map((v, i) => pendingVariant(p.id, v, p.variants.length + i, now))] } : p,
                          ),
                      }
                    : old,
            );
            return { prev };
        },
        onError: (err, _vars, ctx) => {
            if (ctx?.prev) qc.setQueryData<ProductsResponse>(key, ctx.prev);
            toast.error(`Couldn't add the variants: ${err.message}`);
        },
        onSuccess: (r) => toast.success(`Added ${r.items.length} variant${r.items.length === 1 ? "" : "s"} in Shopify.`),
        onSettled: () => void qc.invalidateQueries({ queryKey: key }),
    });
}

export function useUpdateProduct(tenant: string): UseMutationResult<ProductPatchResult, ApiError, { id: string; patch: ProductPatch }, Snapshot> {
    const qc = useQueryClient();
    const key = queryKeys.admin.products(tenant);
    return useMutation<ProductPatchResult, ApiError, { id: string; patch: ProductPatch }, Snapshot>({
        mutationFn: ({ id, patch }) => updateProduct(tenant, id, patch),
        onMutate: async ({ id, patch }) => {
            await qc.cancelQueries({ queryKey: key });
            const prev = qc.getQueryData<ProductsResponse>(key);
            qc.setQueryData<ProductsResponse>(key, (old) => (old ? { items: old.items.map((p) => (p.id === id ? { ...p, ...patch } : p)) } : old));
            return { prev };
        },
        onError: (err, _vars, ctx) => {
            if (ctx?.prev) qc.setQueryData<ProductsResponse>(key, ctx.prev);
            toast.error(`Couldn't save the product: ${err.message}`);
        },
        onSuccess: (p) =>
            p.pushedToShopify
                ? toast.success(`“${p.title}”: saved and pushed to Shopify. The storefront refreshes in a moment.`)
                : toast.info(`“${p.title}”: saved locally — product not linked to Shopify. Run a sync to link it.`),
        onSettled: () => void qc.invalidateQueries({ queryKey: key }),
    });
}

/** Attribute-only patches never touch Shopify, so the "pushed" wording doesn't apply. */
function isAppearanceOnly(patch: VariantPatch): boolean {
    return Object.keys(patch).every((k) => k === "attributes");
}

export function useUpdateVariant(tenant: string): UseMutationResult<VariantPatchResult, ApiError, { id: string; sku: string; patch: VariantPatch }, Snapshot> {
    const qc = useQueryClient();
    const key = queryKeys.admin.products(tenant);
    return useMutation<VariantPatchResult, ApiError, { id: string; sku: string; patch: VariantPatch }, Snapshot>({
        mutationFn: ({ id, patch }) => updateVariant(tenant, id, patch),
        onMutate: async ({ id, patch }) => {
            await qc.cancelQueries({ queryKey: key });
            const prev = qc.getQueryData<ProductsResponse>(key);
            qc.setQueryData<ProductsResponse>(key, (old) =>
                old ? { items: old.items.map((p) => ({ ...p, variants: p.variants.map((v) => (v.id === id ? { ...v, ...patch } : v)) })) } : old,
            );
            return { prev };
        },
        onError: (err, vars, ctx) => {
            if (ctx?.prev) qc.setQueryData<ProductsResponse>(key, ctx.prev);
            toast.error(`${vars.sku}: ${err.message}`);
        },
        onSuccess: (res, vars) =>
            isAppearanceOnly(vars.patch)
                ? toast.success(`${vars.sku} appearance saved. The storefront refreshes in a moment.`)
                : res.pushedToShopify ? toast.success(`${vars.sku} saved and pushed to Shopify.`) : toast.info(`${vars.sku} saved locally — not linked to Shopify, so checkout prices are unchanged. Run a sync to link it.`),
        onSettled: () => void qc.invalidateQueries({ queryKey: key }),
    });
}

/** No cache to patch optimistically — the sync rewrites the catalogue server-side. */
export function useCatalogSync(tenant: string): UseMutationResult<SyncResult, ApiError, void> {
    const qc = useQueryClient();
    return useMutation<SyncResult, ApiError, void>({
        mutationFn: () => syncCatalog(tenant),
        onSuccess: (r) => {
            const unlinked = r.unlinked.length > 0 ? ` ${r.unlinked.length} local SKU${r.unlinked.length === 1 ? "" : "s"} not found in Shopify: ${r.unlinked.slice(0, 5).join(", ")}${r.unlinked.length > 5 ? "…" : ""}.` : "";
            toast.success(`Shopify sync done — ${r.linked} linked, ${r.created} created.${unlinked}`);
        },
        onError: (err) => toast.error(`Sync failed: ${err.message}`),
        onSettled: () => void qc.invalidateQueries({ queryKey: queryKeys.admin.products(tenant) }),
    });
}

export function useCatalogImport(tenant: string): UseMutationResult<ImportResult, ApiError, string> {
    const qc = useQueryClient();
    return useMutation<ImportResult, ApiError, string>({
        mutationFn: (csv) => importCatalogCsv(tenant, csv),
        onSuccess: (r) => toast.success(`Imported ${r.products} products and ${r.variants} variants. Run “Sync from Shopify” to link them.`),
        onError: (err) => toast.error(`Import failed: ${err.message}`),
        onSettled: () => void qc.invalidateQueries({ queryKey: queryKeys.admin.products(tenant) }),
    });
}
