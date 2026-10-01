export type ProductKind = "standard" | "bundle" | "membership" | "service_deposit";
export type ProductStatus = "active" | "draft" | "archived";

/** Presentation attributes (swatch, finish, silhouette…) — ours, not Shopify's. Multiselect values are comma-joined. */
export type Attributes = Record<string, string>;

export type AttributeType = "color" | "select" | "multiselect" | "text";

export interface AttributeDef {
    key: string;
    label: string;
    type: AttributeType;
    options?: string[];
    help?: string;
}

export interface KnownTag {
    tag: string;
    meaning: string;
}

/** Per-store form definition from GET /admin/catalog/schema. */
export interface CatalogSchema {
    productAttributes: AttributeDef[];
    variantAttributes: AttributeDef[];
    tags: KnownTag[];
}

export interface BundleRule {
    pick: number;
    priceCents: number;
    eligibleSkus: string[];
}

export interface MembershipRule {
    intervalDays: number;
    perks: string[];
}

export interface Variant {
    id: string;
    productId: string;
    sku: string;
    optionLabel: string | null;
    priceCents: number;
    compareAtCents: number | null;
    inventoryQty: number;
    inventoryItemId: string | null;
    shopifyVariantId: string | null;
    position: number;
    attributes: Attributes;
    updatedAt: string;
}

export interface AdminProduct {
    id: string;
    handle: string;
    title: string;
    description: string;
    kind: ProductKind;
    status: ProductStatus;
    tags: string[];
    attributes: Attributes;
    position: number;
    media: string[];
    shopifyProductId: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
    bundleRule: BundleRule | null;
    membershipRule: MembershipRule | null;
    createdAt: string;
    updatedAt: string;
    variants: Variant[];
}

export interface ProductsResponse {
    items: AdminProduct[];
}

export interface ProductPatch {
    title?: string;
    tags?: string[];
    attributes?: Attributes;
    position?: number;
    description?: string;
    status?: ProductStatus;
    seoTitle?: string | null;
    seoDescription?: string | null;
    media?: string[];
    bundleRule?: BundleRule | null;
    membershipRule?: MembershipRule | null;
}

export interface VariantPatch {
    /** Option value shown to shoppers (shade / size name) — renamed in Shopify. */
    option?: string;
    priceCents?: number;
    compareAtCents?: number | null;
    inventoryQty?: number;
    attributes?: Attributes;
}

export type ProductPatchResult = Omit<AdminProduct, "variants"> & { pushedToShopify: boolean };

export interface NewVariantInput {
    sku: string;
    option: string | null;
    priceCents: number;
    compareAtCents: number | null;
    inventoryQty: number;
    attributes: Attributes;
}

export interface NewProductInput {
    handle: string;
    title: string;
    description: string;
    status: ProductStatus;
    tags: string[];
    attributes: Attributes;
    media: string[];
    optionName: string | null;
    variants: NewVariantInput[];
}

export interface AddVariantsInput {
    optionName: string;
    variants: NewVariantInput[];
}

export interface AddVariantsResult {
    items: Variant[];
}

export interface VariantPatchResult {
    variant: Variant;
    pushedToShopify: boolean;
}

export interface SyncResult {
    linked: number;
    created: number;
    unlinked: string[];
}

export interface ImportResult {
    products: number;
    variants: number;
}
