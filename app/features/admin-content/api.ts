import { apiFetch } from "@/core/api-client";
import type { StoredSite } from "@/features/storefront/site";
import type {
    AdminPage,
    AdminPageRecord,
    PageSection,
    PageSeoInput,
    PagesResponse,
    Post,
    PostInput,
    PostsResponse,
    SectionDef,
    SectionPatch,
    ThemeResponse,
    ThemeSaveResponse,
    ThemeTokens,
} from "./types";

export type * from "./types";

// ── Page builder ──

export async function fetchPages(tenant: string): Promise<AdminPage[]> {
    const res = await apiFetch<PagesResponse>("/admin/pages", { tenant });
    return res.items;
}

export async function fetchSectionLibrary(tenant: string): Promise<SectionDef[]> {
    const res = await apiFetch<{ items: SectionDef[] }>("/admin/section-library", { tenant });
    return res.items;
}

export async function savePage(tenant: string, slug: string, input: PageSeoInput): Promise<AdminPageRecord> {
    return apiFetch<AdminPageRecord>(`/admin/pages/${encodeURIComponent(slug)}`, { tenant, method: "PUT", body: input });
}

export async function addSection(tenant: string, slug: string, type: string): Promise<PageSection> {
    return apiFetch<PageSection>(`/admin/pages/${encodeURIComponent(slug)}/sections`, { tenant, method: "POST", body: { type } });
}

export async function patchSection(tenant: string, id: string, patch: SectionPatch): Promise<PageSection> {
    return apiFetch<PageSection>(`/admin/sections/${encodeURIComponent(id)}`, { tenant, method: "PATCH", body: patch });
}

export async function reorderSections(tenant: string, slug: string, ids: string[]): Promise<void> {
    await apiFetch(`/admin/pages/${encodeURIComponent(slug)}/sections/reorder`, { tenant, method: "POST", body: { ids } });
}

export async function deleteSection(tenant: string, id: string): Promise<void> {
    await apiFetch(`/admin/sections/${encodeURIComponent(id)}`, { tenant, method: "DELETE" });
}

// ── Site chrome (menu + footer) ──

export async function fetchSite(tenant: string): Promise<StoredSite> {
    return apiFetch<StoredSite>("/admin/site", { tenant });
}

/** Labels a storefront doesn't show are "" in the resolved site — they're not stored. */
export async function saveSite(tenant: string, site: StoredSite): Promise<StoredSite> {
    const labels = Object.fromEntries(Object.entries(site.labels ?? {}).filter(([, v]) => typeof v === "string" && v.trim() !== ""));
    return apiFetch<StoredSite>("/admin/site", { tenant, method: "PUT", body: { nav: site.nav, footer: site.footer, labels: Object.keys(labels).length > 0 ? labels : null } });
}

// ── Journal ──

export async function fetchPosts(tenant: string): Promise<Post[]> {
    const res = await apiFetch<PostsResponse>("/admin/posts", { tenant });
    return res.items;
}

export async function createPost(tenant: string, input: PostInput): Promise<Post> {
    return apiFetch<Post>("/admin/posts", { tenant, method: "POST", body: input });
}

export async function updatePost(tenant: string, id: string, input: PostInput): Promise<Post> {
    return apiFetch<Post>(`/admin/posts/${encodeURIComponent(id)}`, { tenant, method: "PUT", body: input });
}

export async function deletePost(tenant: string, id: string): Promise<void> {
    await apiFetch(`/admin/posts/${encodeURIComponent(id)}`, { tenant, method: "DELETE" });
}

// ── Theme ──

export async function fetchTheme(tenant: string): Promise<ThemeResponse> {
    return apiFetch<ThemeResponse>("/admin/theme", { tenant });
}

export async function saveTheme(tenant: string, tokens: ThemeTokens): Promise<ThemeSaveResponse> {
    return apiFetch<ThemeSaveResponse>("/admin/theme", { tenant, method: "PUT", body: tokens });
}
