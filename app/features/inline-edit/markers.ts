import type { ResolvedSection } from "@/features/storefront/types";

/**
 * Inline-edit marker contract — SOLE owner. When an admin views a storefront, the server
 * stamps editable content with these attributes; the inline editor reads them back to know
 * what a piece of text (or a photo) is and where it is saved. Visitors get no markers.
 *
 *   data-edit="section:<id>:<A|B>:<field>"   page-builder section copy
 *   data-edit="site:<path>"                   menu / footer (e.g. "nav.0.label")
 *   data-edit="product:<handle>:title"        product name (→ Shopify)
 *   data-edit="product:<handle>:price"        one price for every variant (e.g. all sizes)
 *   data-edit="section:<id>:<A|B>:<field>#<i>" one item of a "|"-separated list prop
 *                                              (+ data-edit-list = the full rendered list, JSON)
 *   data-edit="variant:<sku>:price"           variant price (→ Shopify)
 *   data-edit="variant:<sku>:option"          variant option value, e.g. a shade name (→ Shopify)
 *   data-edit="attribute:<sku>:<key>"         presentation attribute (finish, undertone); allowed
 *                                              values come from the API's catalogue schema
 *   data-edit-media="<handle>"                product cover photo (→ Shopify)
 */
export const EDIT_ATTR = "data-edit";
export const EDIT_VALUE_ATTR = "data-edit-value";
export const EDIT_MEDIA_ATTR = "data-edit-media";
export const EDIT_LIST_ATTR = "data-edit-list";

export type EditAttrs = Partial<Record<typeof EDIT_ATTR | typeof EDIT_VALUE_ATTR | typeof EDIT_MEDIA_ATTR | typeof EDIT_LIST_ATTR, string>>;

export type EditTarget =
    | { kind: "section"; sectionId: string; variant: "A" | "B"; field: string }
    | { kind: "site"; path: string }
    | { kind: "product"; handle: string; field: "title" | "price" }
    | { kind: "variant"; sku: string; field: "price" | "option" }
    | { kind: "attribute"; sku: string; key: string };

const NO_ATTRS: EditAttrs = {};

const mark = (key: string, value: string): EditAttrs => ({ [EDIT_ATTR]: key, [EDIT_VALUE_ATTR]: value });

export function editAttrs(section: ResolvedSection, field: string, value: string): EditAttrs {
    return section.editable ? mark(`section:${section.id}:${section.variant === "B" ? "B" : "A"}:${field}`, value) : NO_ATTRS;
}

/** One item of a list prop (marquee items, trust badges). The full list travels with it. */
export function listItemAttrs(section: ResolvedSection, field: string, list: readonly string[], index: number): EditAttrs {
    if (!section.editable) return NO_ATTRS;
    return { ...mark(`section:${section.id}:${section.variant === "B" ? "B" : "A"}:${field}#${index}`, list[index] ?? ""), [EDIT_LIST_ATTR]: JSON.stringify(list) };
}

export function siteEditAttrs(editor: boolean, path: string, value: string): EditAttrs {
    return editor ? mark(`site:${path}`, value) : NO_ATTRS;
}

export function productTitleAttrs(editor: boolean, handle: string | undefined, title: string): EditAttrs {
    return editor && handle ? mark(`product:${handle}:title`, title) : NO_ATTRS;
}

const plainPrice = (price: number): string => (Number.isInteger(price) ? String(price) : price.toFixed(2));

/** `price` in dollars; while editing the admin sees the plain number ("28" / "28.50"). */
export function priceAttrs(editor: boolean, sku: string, price: number): EditAttrs {
    return editor ? mark(`variant:${sku}:price`, plainPrice(price)) : NO_ATTRS;
}

/** A price shown once for the whole product (all sizes) — publishing reprices every variant. */
export function productPriceAttrs(editor: boolean, handle: string | undefined, price: number): EditAttrs {
    return editor && handle ? mark(`product:${handle}:price`, plainPrice(price)) : NO_ATTRS;
}

/** A variant's option value as shoppers see it (VELOUR shade names). */
export function optionAttrs(editor: boolean, sku: string, name: string): EditAttrs {
    return editor ? mark(`variant:${sku}:option`, name) : NO_ATTRS;
}

/** A variant presentation attribute shown as text (validated against the catalogue schema). */
export function attributeAttrs(editor: boolean, sku: string, key: string, value: string): EditAttrs {
    return editor ? mark(`attribute:${sku}:${key}`, value) : NO_ATTRS;
}

export function photoAttrs(editor: boolean, handle: string | undefined): EditAttrs {
    return editor && handle ? { [EDIT_MEDIA_ATTR]: handle } : NO_ATTRS;
}

export function parseEditTarget(raw: string | null): EditTarget | null {
    const [kind, ...rest] = (raw ?? "").split(":");
    switch (kind) {
        case "section": {
            const [sectionId, variant, field] = rest;
            return sectionId && field && (variant === "A" || variant === "B") ? { kind, sectionId, variant, field } : null;
        }
        case "site":
            return rest[0] ? { kind, path: rest.join(":") } : null;
        case "product":
            return rest[0] && (rest[1] === "title" || rest[1] === "price") ? { kind, handle: rest[0], field: rest[1] } : null;
        case "variant":
            // SKUs may contain ":" (e.g. "wool-overcoat:M") — the field is always last.
            {
                const field = rest.at(-1);
                return rest.length >= 2 && (field === "price" || field === "option") ? { kind, sku: rest.slice(0, -1).join(":"), field } : null;
            }
        case "attribute":
            // sku may contain ":" — the attribute key is always last.
            return rest.length >= 2 && rest.at(-1) ? { kind, sku: rest.slice(0, -1).join(":"), key: rest.at(-1) as string } : null;
        default:
            return null;
    }
}

/** Price fields must parse as a number before they can be published. */
export function isPriceTarget(t: EditTarget): boolean {
    return (t.kind === "variant" && t.field === "price") || (t.kind === "product" && t.field === "price");
}

/** Case-insensitive match against an attribute's allowed values → the canonical value, or null. */
export function matchOption(value: string, options: readonly string[]): string | null {
    const v = value.trim().toLowerCase();
    return options.find((o) => o.toLowerCase() === v) ?? null;
}
