import { cssColor, isRenderableMedia } from "@/features/storefront/constants";
import type { StoreProduct } from "@/features/storefront/types";
import { BUNDLE, BUNDLE_ITEMS, LIP_SHADES } from "./constants";
import { SKIN_TONES, UNDERTONES, type BeautyCatalog, type BundleItem, type LipShade, type SkinTone, type Undertone } from "./types";

const HERO_NAME = "Ruby Noir";

const isUndertone = (v: string | undefined): v is Undertone => (UNDERTONES as readonly string[]).includes(v ?? "");
const toTones = (v: string | undefined): SkinTone[] => (v ?? "").split(",").filter((t): t is SkinTone => (SKIN_TONES as readonly string[]).includes(t));

/**
 * Live products → the shapes VELOUR's designed sections render.
 * `lip`-tagged products contribute one shade per variant; `bundle-pick` products feed the
 * set builder. Falls back to the built-in catalogue when the API has nothing (or is down).
 */
export function beautyCatalog(products: readonly StoreProduct[]): BeautyCatalog {
    const shades: LipShade[] = products
        .filter((p) => p.tags.includes("lip"))
        .flatMap((p) => {
            const image = p.media.find((m) => isRenderableMedia(m));
            return p.variants.map((v) => ({
                id: v.sku,
                sku: v.sku,
                productName: p.title,
                handle: p.handle,
                name: v.option ?? p.title,
                finish: v.attributes.finish ?? "Velvet matte",
                swatch: cssColor(v.attributes.swatch, "var(--color-rose-500)"),
                price: v.priceCents / 100,
                undertone: isUndertone(v.attributes.undertone) ? v.attributes.undertone : "neutral",
                bestFor: toTones(v.attributes.bestFor),
                image,
            }));
        });
    const liveShades = shades.length > 0 ? shades : [...LIP_SHADES];

    const bundleProduct = products.find((p) => p.kind === "bundle" && p.bundleRule);
    const picks: BundleItem[] = products
        .filter((p) => p.tags.includes("bundle-pick"))
        .map((p) => {
            const v = p.variants[0];
            return { id: v?.sku ?? p.handle, handle: p.handle, name: p.title, price: (v?.priceCents ?? 0) / 100, tint: cssColor(p.attributes.tint, "var(--color-rose-300)"), image: p.media.find((m) => isRenderableMedia(m)) };
        })
        .filter((item) => !bundleProduct?.bundleRule || bundleProduct.bundleRule.eligibleSkus.includes(item.id));

    const hero = liveShades.find((s) => s.name === HERO_NAME) ?? liveShades[0] ?? (LIP_SHADES[0] as LipShade);
    return {
        shades: liveShades,
        hero,
        bundle: {
            pick: bundleProduct?.bundleRule?.pick ?? BUNDLE.size,
            price: bundleProduct?.bundleRule ? bundleProduct.bundleRule.priceCents / 100 : BUNDLE.price,
            items: picks.length > 0 ? picks : [...BUNDLE_ITEMS],
        },
    };
}
