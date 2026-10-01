import { dollarsToCents } from "@/core/formatters";
import { HEX_RE, MEDIA_MAX, OPTION_MAX, OPTION_NAME_MAX, SKU_MAX, SKU_RE, TAG_RE } from "../constants";
import type { AttributeDef, Attributes, NewVariantInput } from "../types";

/** "Ruby Noir — Velvet" → "ruby-noir-velvet" (valid handle / SKU segment). */
export function slugify(text: string): string {
    return text
        .normalize("NFKD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80)
        .replace(/-+$/g, "");
}

export function isHttps(url: string): boolean {
    try {
        return new URL(url).protocol === "https:";
    } catch {
        return false;
    }
}

/** One URL per line → list + the first problem (or null). */
export function parseMedia(text: string): { media: string[]; error: string | null } {
    const media = text.split("\n").map((s) => s.trim()).filter(Boolean);
    if (media.length > MEDIA_MAX) return { media, error: `At most ${MEDIA_MAX} images.` };
    if (media.some((u) => !isHttps(u))) return { media, error: "Every media URL must be a full https:// address." };
    return { media, error: null };
}

/** Same normalisation as the API; null when the tag can't be stored. */
export function normalizeTag(raw: string): string | null {
    const tag = raw.trim().toLowerCase();
    return TAG_RE.test(tag) ? tag : null;
}

/** Only keys the store's schema knows, with blanks dropped (the API rejects unknown keys). */
export function pickAttributes(defs: readonly AttributeDef[], attrs: Attributes): Attributes {
    const out: Attributes = {};
    for (const def of defs) {
        const value = (attrs[def.key] ?? "").trim();
        if (value) out[def.key] = value;
    }
    return out;
}

/** First invalid attribute message, mirroring the API's per-type rules. */
export function attributeError(defs: readonly AttributeDef[], attrs: Attributes): string | null {
    for (const def of defs) {
        const value = (attrs[def.key] ?? "").trim();
        if (!value) continue;
        if (def.type === "color" && !HEX_RE.test(value)) return `${def.label} must be a #rrggbb color.`;
        if (def.type === "select" && !def.options?.includes(value)) return `${def.label} must be one of: ${def.options?.join(", ") ?? ""}.`;
        if (def.type === "multiselect" && value.split(",").some((p) => !def.options?.includes(p.trim()))) return `${def.label} has an unknown option.`;
        if (def.type === "text" && value.length > 120) return `${def.label} is too long (120 characters max).`;
    }
    return null;
}

export interface VariantRow {
    rowId: string;
    option: string;
    /** null = follow the auto-suggestion until the admin types their own SKU. */
    sku: string | null;
    price: string;
    compareAt: string;
    stock: string;
    attributes: Attributes;
}

export type RowField = "option" | "sku" | "price" | "compareAt" | "stock" | "attributes";
export type RowErrors = Record<string, Partial<Record<RowField, string>>>;

let rowSeq = 0;

export function newVariantRow(): VariantRow {
    rowSeq += 1;
    return { rowId: `variant-row-${rowSeq}`, option: "", sku: null, price: "", compareAt: "", stock: "0", attributes: {} };
}

/** `${handle}:${option-slug}` for multi-variant products, `${handle}` for a single default variant. */
export function suggestSku(handle: string, option: string, multi: boolean): string {
    if (!handle) return "";
    const opt = slugify(option);
    return multi ? (opt ? `${handle}:${opt}` : "") : handle;
}

export function rowSku(row: VariantRow, handle: string, multi: boolean): string {
    return row.sku ?? suggestSku(handle, row.option, multi);
}

interface RowValidation {
    variants: NewVariantInput[];
    rowErrors: RowErrors;
}

/**
 * Client-side mirror of the API rules: price required, unique SKUs (also against SKUs already
 * in the catalogue), option value required when there are several variants (or always when adding).
 */
export function validateVariantRows(
    rows: readonly VariantRow[],
    opts: { handle: string; requireOption: boolean; defs: readonly AttributeDef[]; takenSkus: ReadonlySet<string> },
): RowValidation {
    const rowErrors: RowErrors = {};
    const variants: NewVariantInput[] = [];
    const multi = opts.requireOption;
    const seenSkus = new Set<string>();
    const seenOptions = new Set<string>();
    for (const row of rows) {
        const errs: Partial<Record<RowField, string>> = {};
        const option = row.option.trim();
        const sku = rowSku(row, opts.handle, multi).trim();
        const priceCents = dollarsToCents(row.price);
        const compareAtCents = row.compareAt.trim() ? dollarsToCents(row.compareAt) : null;
        const qty = Number(row.stock.trim() || "0");

        if (multi && !option) errs.option = "Each variant needs a value (e.g. Ruby Noir, M).";
        else if (option.length > OPTION_MAX) errs.option = `At most ${OPTION_MAX} characters.`;
        else if (option && seenOptions.has(option.toLowerCase())) errs.option = "Two variants share this value.";
        if (!sku) errs.sku = "Set a SKU.";
        else if (sku.length > SKU_MAX || !SKU_RE.test(sku)) errs.sku = "Letters, digits, : _ - only.";
        else if (seenSkus.has(sku.toLowerCase())) errs.sku = "SKUs must be unique.";
        else if (opts.takenSkus.has(sku.toLowerCase())) errs.sku = "This SKU is already in the catalogue.";
        if (priceCents === null) errs.price = "Set a price.";
        if (row.compareAt.trim() && compareAtCents === null) errs.compareAt = "Not a valid amount.";
        if (!Number.isInteger(qty) || qty < 0 || qty > 1_000_000) errs.stock = "Whole number, 0 or more.";
        const attrErr = attributeError(opts.defs, row.attributes);
        if (attrErr) errs.attributes = attrErr;

        if (option) seenOptions.add(option.toLowerCase());
        if (sku) seenSkus.add(sku.toLowerCase());
        if (Object.keys(errs).length > 0) {
            rowErrors[row.rowId] = errs;
            continue;
        }
        variants.push({
            sku,
            option: option || null,
            priceCents: priceCents ?? 0,
            compareAtCents,
            inventoryQty: qty,
            attributes: pickAttributes(opts.defs, row.attributes),
        });
    }
    return { variants, rowErrors };
}

export function optionNameError(name: string, required: boolean): string | null {
    const trimmed = name.trim();
    if (required && !trimmed) return "Name what the variants differ by (e.g. Shade, Size).";
    if (trimmed.length > OPTION_NAME_MAX) return `At most ${OPTION_NAME_MAX} characters.`;
    return null;
}
