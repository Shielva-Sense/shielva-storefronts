import type { SiteChrome } from "./site";

export type StoreSlug = "beauty" | "salon" | "fashion";

export interface CatalogItem {
    sku: string;
    option: string | null;
    priceCents: number;
    compareAtCents: number | null;
    inventoryQty: number;
    handle: string;
    title: string;
    kind: "standard" | "bundle" | "membership" | "service_deposit";
    inStock: boolean;
}
export interface StoreVariant {
    sku: string;
    option: string | null;
    priceCents: number;
    compareAtCents: number | null;
    inStock: boolean;
    attributes: Record<string, string>;
}

/** A merchandised product (from Shopify + our presentation attributes). Sections select by tag. */
export interface StoreProduct {
    handle: string;
    title: string;
    description: string;
    kind: CatalogItem["kind"];
    tags: string[];
    attributes: Record<string, string>;
    media: string[];
    bundleRule: { pick: number; priceCents: number; eligibleSkus: string[] } | null;
    variants: StoreVariant[];
}

export interface CatalogPayload {
    currency: string;
    items: CatalogItem[];
    products: StoreProduct[];
}

export interface SectionInstance {
    id: string;
    type: string;
    props: Record<string, string>;
    variantBProps: Record<string, string> | null;
    abSplit: number;
}
export interface PagePayload {
    seo: {
        title: string;
        description: string;
        canonicalPath: string;
        schema: { product: boolean; breadcrumb: boolean; faq: boolean; localBusiness: boolean };
        collectionCopy: string;
    };
    sections: SectionInstance[];
}

/** A section after A/B resolution — what the renderer consumes. */
export interface ResolvedSection {
    id: string;
    type: string;
    props: Record<string, string>;
    variant: "A" | "B" | null;
    /** True only when an admin views the page — text then carries inline-edit markers. */
    editable: boolean;
}

export interface ReviewItem {
    id: string;
    sku: string;
    authorName: string;
    rating: number;
    body: string;
    verified: boolean;
    createdAt: string;
}
export interface ReviewsPayload {
    average: number;
    count: number;
    distribution: number[];
    items: ReviewItem[];
}

export interface PostSummary {
    slug: string;
    title: string;
    excerpt: string;
    author: string;
    publishedAt: string | null;
}
export interface Post extends PostSummary {
    id: string;
    bodyMd: string;
    seoTitle: string | null;
    seoDescription: string | null;
    updatedAt: string;
}

export interface StorefrontData {
    page: PagePayload | null;
    sections: ResolvedSection[];
    experiments: Record<string, "A" | "B">;
    catalog: CatalogItem[];
    products: StoreProduct[];
    reviews: ReviewsPayload | null;
    theme: Record<string, string>;
    posts: PostSummary[];
    /** Header menu + footer (stored or defaults). */
    site: SiteChrome;
    /** An admin session cookie is present → load the inline editor (the API re-checks the role). */
    editor: boolean;
}

export interface CheckoutLine {
    sku: string;
    qty: number;
    name: string;
    variant?: string;
    components?: string[];
}
