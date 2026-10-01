import type { Tone } from "@/components/ui/StatusBadge";
import type { ProductKind, ProductStatus } from "./types";

export const PRODUCT_STATUSES = [
    { value: "active", label: "Active" },
    { value: "draft", label: "Draft" },
    { value: "archived", label: "Archived" },
] as const satisfies readonly { value: ProductStatus; label: string }[];

export const STATUS_TONES: Record<ProductStatus, Tone> = { active: "success", draft: "warning", archived: "neutral" };

export const KIND_LABELS: Record<ProductKind, string> = {
    standard: "Product",
    bundle: "Bundle",
    membership: "Membership",
    service_deposit: "Service deposit",
};

export const KIND_TONES: Record<ProductKind, Tone> = { standard: "neutral", bundle: "info", membership: "success", service_deposit: "warning" };

export const SEO_TITLE_MAX = 70;
export const SEO_DESCRIPTION_MAX = 170;
export const MEDIA_MAX = 12;
export const LOW_STOCK = 5;
export const CSV_MAX_BYTES = 4_000_000;

/** Mirrors the API validation so the forms catch mistakes before a Shopify round-trip. */
export const HANDLE_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const HANDLE_MAX = 80;
export const SKU_RE = /^[a-z0-9:_-]+$/i;
export const SKU_MAX = 120;
export const TAG_RE = /^[a-z0-9][a-z0-9-]{0,39}$/;
export const TAGS_MAX = 30;
export const VARIANTS_MAX = 50;
export const OPTION_MAX = 80;
export const OPTION_NAME_MAX = 40;
export const HEX_RE = /^#[0-9a-f]{6}$/i;

/** Optimistic rows carry this id prefix until the server answers — they are not editable yet. */
export const PENDING_PREFIX = "pending-";

/** What a variant "is" per storefront (Shopify's option name). */
export const OPTION_NAME_DEFAULTS: Record<string, string> = { beauty: "Shade", fashion: "Size" };
export const OPTION_NAME_FALLBACK = "Option";
