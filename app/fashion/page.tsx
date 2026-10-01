import type { Metadata } from "next";
import { JsonLd } from "@/components/ui/JsonLd";
import { FashionStorefront } from "@/features/fashion/components/FashionStorefront";
import { fashionCatalog, skuForSize } from "@/features/fashion/catalog";
import { FASHION_BRAND, FASHION_FALLBACK_SECTIONS } from "@/features/fashion/constants";
import { priceFrom } from "@/features/storefront/catalog";
import { loadPage, loadStorefront } from "@/features/storefront/server";
import { breadcrumbSchema, pageMetadata, productListSchema } from "@/core/seo";
import { ROUTES } from "@/core/site";

const FALLBACK_META = {
    title: "ATELIER NORD — Sustainable Clothing, Fit Guaranteed",
    description: "Fewer, better clothes: recycled-wool overcoats, organic oxford shirts and merino knits at their true cost. Find your size in three questions, with free 30-day exchanges.",
};

export async function generateMetadata(): Promise<Metadata> {
    const page = await loadPage("fashion");
    return pageMetadata({
        title: page?.seo.title ?? FALLBACK_META.title,
        description: page?.seo.description ?? FALLBACK_META.description,
        path: page?.seo.canonicalPath ?? ROUTES.fashion,
        keywords: ["sustainable clothing brand", "organic cotton shirt", "wool overcoat", "transparent pricing fashion", "size guide"],
    });
}

export default async function FashionPage(): Promise<React.JSX.Element> {
    const data = await loadStorefront("fashion", FASHION_FALLBACK_SECTIONS);
    const schema = data.page?.seo.schema ?? { product: true, breadcrumb: true, faq: false, localBusiness: false };
    const products = fashionCatalog(data.products).items.map((p) => ({
        id: p.id,
        name: p.name,
        price: priceFrom(data.catalog, skuForSize(p, "M"), p.price),
        blurb: [p.name, p.colourName, p.material].filter(Boolean).join(" · "),
        rating: 4.7,
        reviews: 180,
    }));
    return (
        <>
            {schema.product ? <JsonLd data={productListSchema("ATELIER NORD permanent collection", ROUTES.fashion, FASHION_BRAND, products)} /> : null}
            {schema.breadcrumb ? <JsonLd data={breadcrumbSchema([{ name: "Storefronts", path: ROUTES.playbook }, { name: FASHION_BRAND, path: ROUTES.fashion }])} /> : null}
            <FashionStorefront data={data} />
        </>
    );
}
