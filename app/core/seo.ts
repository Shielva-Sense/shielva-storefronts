import type { Metadata } from "next";
import { CURRENCY_CODE } from "./formatters";
import { absoluteUrl } from "./site";
import type { Product } from "./types";

interface PageMetaInput {
    title: string;
    description: string;
    path: string;
    keywords: readonly string[];
}

export function pageMetadata({ title, description, path, keywords }: PageMetaInput): Metadata {
    return {
        title,
        description,
        keywords: [...keywords],
        alternates: { canonical: absoluteUrl(path) },
        openGraph: { title, description, url: absoluteUrl(path), type: "website", locale: "en_US" },
        twitter: { card: "summary_large_image", title, description },
    };
}

export function productListSchema(name: string, path: string, brand: string, products: readonly Product[]): Record<string, unknown> {
    return {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name,
        url: absoluteUrl(path),
        itemListElement: products.map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: {
                "@type": "Product",
                name: p.name,
                description: p.blurb,
                brand: { "@type": "Brand", name: brand },
                offers: {
                    "@type": "Offer",
                    price: p.price,
                    priceCurrency: CURRENCY_CODE,
                    availability: "https://schema.org/InStock",
                    url: absoluteUrl(`${path}#${p.id}`),
                },
                aggregateRating: { "@type": "AggregateRating", ratingValue: p.rating, reviewCount: p.reviews },
            },
        })),
    };
}

export function breadcrumbSchema(items: readonly { name: string; path: string }[]): Record<string, unknown> {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: absoluteUrl(it.path) })),
    };
}
