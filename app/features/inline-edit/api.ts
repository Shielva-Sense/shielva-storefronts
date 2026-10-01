import { fetchProducts, updateProduct, updateVariant, uploadProductPhoto } from "@/features/admin-catalog/api";
import { fetchPages, patchSection, reorderSections, saveSite } from "@/features/admin-content/api";
import type { SectionPatch } from "@/features/admin-content/types";
import type { SiteChrome } from "@/features/storefront/site";
import type { InlineChange, PublishSummary } from "./types";

export type * from "./types";

/** "$28.50" / "28,5" / "28" → cents; null when it isn't a sensible price. */
export function parsePriceCents(raw: string): number | null {
    const n = Number.parseFloat(raw.replace(/[^0-9.,]/g, "").replace(",", "."));
    return Number.isFinite(n) && n >= 0 && n < 100_000 ? Math.round(n * 100) : null;
}

/** Write `value` at a dotted path ("footer.columns.1.links.0.label") of a deep copy of the site. */
export function applySitePath(site: SiteChrome, path: string, value: string): SiteChrome {
    const copy = structuredClone(site);
    const keys = path.split(".");
    let node: unknown = copy;
    for (const k of keys.slice(0, -1)) node = (node as Record<string, unknown> | undefined)?.[k];
    const last = keys.at(-1);
    if (!node || typeof node !== "object" || !last || typeof (node as Record<string, unknown>)[last] !== "string") throw new Error(`Unknown site field "${path}"`);
    (node as Record<string, unknown>)[last] = value;
    return copy;
}

/**
 * Publish every pending in-place change: section copy (page builder), menu/footer (site),
 * product names and prices (pushed to Shopify by the API). Groups run in parallel.
 */
export async function publishChanges(tenant: string, changes: readonly InlineChange[], site: SiteChrome): Promise<PublishSummary> {
    const sectionChanges = changes.filter((c) => c.target.kind === "section");
    const siteChanges = changes.filter((c) => c.target.kind === "site");
    const catalogChanges = changes.filter((c) => c.target.kind === "product" || c.target.kind === "variant" || c.target.kind === "attribute");

    const sections = async (): Promise<number> => {
        if (sectionChanges.length === 0) return 0;
        const stored = new Map((await fetchPages(tenant)).flatMap((p) => p.sections).map((s) => [s.id, s]));
        const patches = new Map<string, SectionPatch>();
        // List props ("a | b | c") are edited item by item; rebuild each list once, then store it.
        const lists = new Map<string, string[]>();
        const fieldValue = (sectionId: string, variant: "A" | "B", field: string, value: string, list: readonly string[] | undefined): [string, string] => {
            const [base, index] = field.split("#");
            if (!base || index === undefined || !list) return [field, value];
            const key = `${sectionId}:${variant}:${base}`;
            const items = lists.get(key) ?? [...list];
            items[Number(index)] = value;
            lists.set(key, items);
            return [base, items.join(" | ")];
        };
        for (const { target, value, list } of sectionChanges) {
            if (target.kind !== "section") continue;
            const section = stored.get(target.sectionId);
            if (!section) throw new Error("A section was removed in the admin — reload the page.");
            const [field, storedValue] = fieldValue(target.sectionId, target.variant, target.field, value, list);
            const patch = patches.get(target.sectionId) ?? {};
            if (target.variant === "B") patch.variantBProps = { ...(patch.variantBProps ?? section.variantBProps ?? {}), [field]: storedValue };
            else patch.props = { ...(patch.props ?? section.props), [field]: storedValue };
            patches.set(target.sectionId, patch);
        }
        await Promise.all([...patches].map(([id, patch]) => patchSection(tenant, id, patch)));
        return patches.size;
    };

    const siteChrome = async (): Promise<boolean> => {
        if (siteChanges.length === 0) return false;
        const next = siteChanges.reduce((acc, c) => (c.target.kind === "site" ? applySitePath(acc, c.target.path, c.value) : acc), site);
        await saveSite(tenant, next);
        return true;
    };

    const catalog = async (): Promise<{ products: number; prices: number; names: number }> => {
        if (catalogChanges.length === 0) return { products: 0, prices: 0, names: 0 };
        const { items } = await fetchProducts(tenant);
        const byHandle = new Map(items.map((p) => [p.handle, p]));
        const bySku = new Map(items.flatMap((p) => p.variants).map((v) => [v.sku, v]));
        const jobs: Promise<unknown>[] = [];
        let products = 0;
        let prices = 0;
        let names = 0;
        const attrEdits = new Map<string, Record<string, string>>();
        for (const { target, value } of catalogChanges) {
            if (target.kind === "product") {
                const product = byHandle.get(target.handle);
                if (!product) throw new Error(`Product "${target.handle}" no longer exists.`);
                if (target.field === "title") {
                    jobs.push(updateProduct(tenant, product.id, { title: value }));
                    products++;
                } else {
                    const cents = parsePriceCents(value);
                    if (cents === null) throw new Error(`"${value}" isn't a valid price.`);
                    for (const v of product.variants) jobs.push(updateVariant(tenant, v.id, { priceCents: cents }));
                    prices++;
                }
            } else if (target.kind === "attribute") {
                const variant = bySku.get(target.sku);
                if (!variant) throw new Error(`SKU "${target.sku}" no longer exists.`);
                // The API replaces the attribute map — merge into the stored one (and earlier edits).
                const merged = { ...(attrEdits.get(variant.id) ?? variant.attributes), [target.key]: value };
                attrEdits.set(variant.id, merged);
            } else if (target.kind === "variant") {
                const variant = bySku.get(target.sku);
                if (!variant) throw new Error(`SKU "${target.sku}" no longer exists.`);
                if (target.field === "option") {
                    jobs.push(updateVariant(tenant, variant.id, { option: value }));
                    names++;
                    continue;
                }
                const cents = parsePriceCents(value);
                if (cents === null) throw new Error(`"${value}" isn't a valid price.`);
                jobs.push(updateVariant(tenant, variant.id, { priceCents: cents }));
                prices++;
            }
        }
        for (const [id, attributes] of attrEdits) jobs.push(updateVariant(tenant, id, { attributes }));
        names += attrEdits.size;
        await Promise.all(jobs);
        return { products, prices, names };
    };

    const [sectionCount, siteSaved, cat] = await Promise.all([sections(), siteChrome(), catalog()]);
    return { sections: sectionCount, site: siteSaved, products: cat.products, prices: cat.prices, names: cat.names };
}

/** Upload a new cover photo for the product with this handle. */
export async function replaceProductPhoto(tenant: string, handle: string, file: File): Promise<void> {
    const product = (await fetchProducts(tenant)).items.find((p) => p.handle === handle);
    if (!product) throw new Error(`Product "${handle}" no longer exists.`);
    await uploadProductPhoto(tenant, product.id, file);
}

/** Save the whole menu + footer (structure edits from the menu panel). */
export async function saveSiteChrome(tenant: string, site: SiteChrome): Promise<void> {
    await saveSite(tenant, site);
}

export interface SectionLayout {
    pageSlug: string;
    /** Section ids, top to bottom. */
    order: string[];
    /** Only sections whose visibility changed. */
    enabled: Record<string, boolean>;
}

/** Show / hide and reorder the page's sections (from the in-page Sections panel). */
export async function saveSectionLayout(tenant: string, layout: SectionLayout): Promise<void> {
    await Promise.all(Object.entries(layout.enabled).map(([id, enabled]) => patchSection(tenant, id, { enabled })));
    await reorderSections(tenant, layout.pageSlug, layout.order);
}
