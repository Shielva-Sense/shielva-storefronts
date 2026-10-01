import "server-only";
import { cookies, headers } from "next/headers";
import { isAdminHost } from "@/core/admin-host";
import { serverFetch } from "@/core/server-api";
import { ADMIN_COOKIE, ANON_COOKIE, FALLBACK_SECTION_PREFIX } from "./constants";
import { resolveSections } from "./experiments";
import { resolveSite, type SiteChrome, type StoredSite } from "./site";
import type { CatalogPayload, PagePayload, Post, PostSummary, ReviewsPayload, SectionInstance, StoreSlug, StorefrontData } from "./types";

/** One parallel round-trip for everything a storefront page renders. */
export async function loadStorefront(slug: StoreSlug, fallbackSections: readonly string[]): Promise<StorefrontData> {
    const [page, catalog, reviews, theme, posts, site, jar, head] = await Promise.all([
        serverFetch<PagePayload>("/pages/home", slug),
        serverFetch<CatalogPayload>("/catalog", slug),
        serverFetch<ReviewsPayload>("/reviews?limit=12", slug),
        serverFetch<{ tokens: Record<string, string> }>("/theme", slug),
        serverFetch<{ items: PostSummary[] }>("/posts", slug),
        serverFetch<StoredSite>("/site", slug),
        cookies(),
        headers(),
    ]);
    // API down → render the storefront's default composition (graceful degradation).
    const instances: SectionInstance[] =
        page?.sections ?? fallbackSections.map((type) => ({ id: `${FALLBACK_SECTION_PREFIX}${type}`, type, props: {}, variantBProps: null, abSplit: 0 }));
    // Editing only on the admin address — never on the public brand domain, even for an admin.
    const editor = isAdminHost(head.get("host")) && jar.has(ADMIN_COOKIE) && page !== null;
    const { sections, experiments } = resolveSections(instances, jar.get(ANON_COOKIE)?.value ?? null, editor);
    return {
        page,
        sections,
        experiments,
        catalog: catalog?.items ?? [],
        products: catalog?.products ?? [],
        reviews,
        theme: theme?.tokens ?? {},
        posts: posts?.items ?? [],
        site: resolveSite(slug, site),
        editor,
    };
}

export async function loadPage(slug: StoreSlug): Promise<PagePayload | null> {
    return serverFetch<PagePayload>("/pages/home", slug);
}

export async function loadPosts(slug: StoreSlug): Promise<PostSummary[]> {
    return (await serverFetch<{ items: PostSummary[] }>("/posts", slug))?.items ?? [];
}

export async function loadPost(slug: StoreSlug, postSlug: string): Promise<Post | null> {
    return serverFetch<Post>(`/posts/${encodeURIComponent(postSlug)}`, slug);
}

export async function loadSite(slug: StoreSlug): Promise<SiteChrome> {
    return resolveSite(slug, await serverFetch<StoredSite>("/site", slug));
}
