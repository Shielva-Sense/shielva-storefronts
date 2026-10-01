import { apiFetch } from "@/core/api-client";
import type {
    AddVariantsInput,
    AddVariantsResult,
    AdminProduct,
    CatalogSchema,
    ImportResult,
    NewProductInput,
    ProductPatch,
    ProductPatchResult,
    ProductsResponse,
    SyncResult,
    VariantPatch,
    VariantPatchResult,
} from "./types";

export type {
    AddVariantsInput,
    AddVariantsResult,
    AdminProduct,
    AttributeDef,
    Attributes,
    BundleRule,
    CatalogSchema,
    ImportResult,
    MembershipRule,
    NewProductInput,
    NewVariantInput,
    ProductKind,
    ProductPatch,
    ProductPatchResult,
    ProductsResponse,
    ProductStatus,
    SyncResult,
    Variant,
    VariantPatch,
    VariantPatchResult,
} from "./types";

export async function fetchProducts(tenant: string): Promise<ProductsResponse> {
    return apiFetch<ProductsResponse>("/admin/products", { tenant });
}

/** Presentation attributes + placement tags this storefront understands (drives the create / edit forms). */
export async function fetchCatalogSchema(tenant: string): Promise<CatalogSchema> {
    return apiFetch<CatalogSchema>("/admin/catalog/schema", { tenant });
}

/** Shopify first (its checkout must know the product), then locally with the returned ids. */
export async function createProduct(tenant: string, input: NewProductInput): Promise<Omit<AdminProduct, "variants">> {
    return apiFetch<Omit<AdminProduct, "variants">>("/admin/products", { method: "POST", tenant, body: input });
}

/** New shade / size on an existing (Shopify-linked) product. */
export async function addVariants(tenant: string, productId: string, input: AddVariantsInput): Promise<AddVariantsResult> {
    return apiFetch<AddVariantsResult>(`/admin/products/${encodeURIComponent(productId)}/variants`, { method: "POST", tenant, body: input });
}

export async function updateProduct(tenant: string, id: string, patch: ProductPatch): Promise<ProductPatchResult> {
    return apiFetch<ProductPatchResult>(`/admin/products/${encodeURIComponent(id)}`, { method: "PATCH", tenant, body: patch });
}

/** Shopify first, then local — linked variants push price / stock to Shopify before our copy changes. */
export async function updateVariant(tenant: string, id: string, patch: VariantPatch): Promise<VariantPatchResult> {
    return apiFetch<VariantPatchResult>(`/admin/variants/${encodeURIComponent(id)}`, { method: "PATCH", tenant, body: patch });
}

/** Replace a product's cover photo (uploaded to Shopify; the storefront picks it up via webhook). */
export async function uploadProductPhoto(tenant: string, id: string, file: File): Promise<{ ok: true; pending: string }> {
    return apiFetch(`/admin/products/${encodeURIComponent(id)}/photo`, { tenant, method: "PUT", file });
}

export async function syncCatalog(tenant: string): Promise<SyncResult> {
    return apiFetch<SyncResult>("/admin/catalog/sync", { method: "POST", tenant });
}

export async function importCatalogCsv(tenant: string, csv: string): Promise<ImportResult> {
    return apiFetch<ImportResult>("/admin/catalog/import", { method: "POST", tenant, body: { csv } });
}
