import type { MetadataRoute } from "next";
import { absoluteUrl, ROUTES } from "@/core/site";
import { loadPosts } from "@/features/storefront/server";
import type { StoreSlug } from "@/features/storefront/types";

const STORES: StoreSlug[] = ["beauty", "salon", "fashion"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const now = new Date();
    const pages: MetadataRoute.Sitemap = Object.values(ROUTES).map((path) => ({ url: absoluteUrl(path), lastModified: now, changeFrequency: "weekly", priority: path === "/" ? 1 : 0.8 }));
    const journals = await Promise.all(
        STORES.map(async (store) => {
            const posts = await loadPosts(store);
            return [
                { url: absoluteUrl(`/${store}/journal`), lastModified: now, changeFrequency: "weekly" as const, priority: 0.6 },
                ...posts.map((p) => ({ url: absoluteUrl(`/${store}/journal/${p.slug}`), lastModified: p.publishedAt ? new Date(p.publishedAt) : now, changeFrequency: "monthly" as const, priority: 0.5 })),
            ];
        }),
    );
    return [...pages, ...journals.flat()];
}
