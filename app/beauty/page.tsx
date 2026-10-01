import type { Metadata } from "next";
import { JsonLd } from "@/components/ui/JsonLd";
import { BeautyStorefront } from "@/features/beauty/components/BeautyStorefront";
import { beautyCatalog } from "@/features/beauty/catalog";
import { BEAUTY_BRAND, BEAUTY_FALLBACK_SECTIONS, BEAUTY_RATING } from "@/features/beauty/constants";
import { priceFrom } from "@/features/storefront/catalog";
import { loadPage, loadStorefront } from "@/features/storefront/server";
import { breadcrumbSchema, pageMetadata, productListSchema } from "@/core/seo";
import { ROUTES } from "@/core/site";

const FALLBACK_META = {
    title: "VELOUR — Vegan Velvet Matte Lipstick in 40 Shades | Find Your Shade",
    description: "Find your perfect lipstick shade in two taps. VELOUR vegan, cruelty-free velvet matte lipsticks matched to your skin depth and undertone, with free shade swaps.",
};

export async function generateMetadata(): Promise<Metadata> {
    const page = await loadPage("beauty");
    return pageMetadata({
        title: page?.seo.title ?? FALLBACK_META.title,
        description: page?.seo.description ?? FALLBACK_META.description,
        path: page?.seo.canonicalPath ?? ROUTES.beauty,
        keywords: ["vegan lipstick", "matte lipstick shades", "lipstick for deep skin tones", "cruelty-free makeup", "shade finder"],
    });
}

export default async function BeautyPage(): Promise<React.JSX.Element> {
    const data = await loadStorefront("beauty", BEAUTY_FALLBACK_SECTIONS);
    const schema = data.page?.seo.schema ?? { product: true, breadcrumb: true, faq: false, localBusiness: false };
    const rating = data.reviews && data.reviews.count > 0 ? { average: data.reviews.average, count: data.reviews.count } : BEAUTY_RATING;
    const shades = beautyCatalog(data.products).shades;
    const products = shades.map((s) => ({
        id: s.sku,
        name: `${s.productName} — ${s.name}`,
        price: priceFrom(data.catalog, s.sku, s.price),
        blurb: `${s.productName} in ${s.name} (${s.finish.toLowerCase()} finish).`,
        rating: rating.average,
        reviews: Math.max(1, Math.round(rating.count / shades.length)),
    }));
    return (
        <>
            {schema.product ? <JsonLd data={productListSchema("VELOUR Velvet Lip shades", ROUTES.beauty, BEAUTY_BRAND, products)} /> : null}
            {schema.breadcrumb ? <JsonLd data={breadcrumbSchema([{ name: "Storefronts", path: ROUTES.playbook }, { name: BEAUTY_BRAND, path: ROUTES.beauty }])} /> : null}
            <BeautyStorefront data={data} />
        </>
    );
}
