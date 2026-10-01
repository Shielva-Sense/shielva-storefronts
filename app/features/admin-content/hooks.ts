"use client";

import { useMutation, useQuery, useQueryClient, type UseMutationResult, type UseQueryResult } from "@tanstack/react-query";
import { toast } from "@/components/ui/Toast";
import type { ApiError } from "@/core/api-client";
import { queryKeys } from "@/core/query-keys";
import {
    addSection,
    createPost,
    deletePost,
    deleteSection,
    fetchPages,
    fetchPosts,
    fetchSectionLibrary,
    fetchTheme,
    patchSection,
    reorderSections,
    savePage,
    saveTheme,
    updatePost,
} from "./api";
import { PENDING_PREFIX } from "./constants";
import type { AdminPage, AdminPageRecord, PageSection, PageSeoInput, Post, PostInput, SectionDef, SectionPatch, ThemeResponse, ThemeSaveResponse, ThemeTokens } from "./types";

type Rollback<T> = { prev: T | undefined };

// ─────────────── Page builder ───────────────

export function usePages(tenant: string): UseQueryResult<AdminPage[], ApiError> {
    return useQuery<AdminPage[], ApiError>({ queryKey: queryKeys.admin.pages(tenant), queryFn: () => fetchPages(tenant) });
}

export function useSectionLibrary(tenant: string): UseQueryResult<SectionDef[], ApiError> {
    return useQuery<SectionDef[], ApiError>({ queryKey: queryKeys.admin.sectionLibrary(tenant), queryFn: () => fetchSectionLibrary(tenant), staleTime: 30 * 60 * 1000 });
}

function mapPage(pages: AdminPage[] | undefined, slug: string, fn: (p: AdminPage) => AdminPage): AdminPage[] | undefined {
    return pages?.map((p) => (p.slug === slug ? fn(p) : p));
}

function mapSections(pages: AdminPage[] | undefined, fn: (s: PageSection[]) => PageSection[]): AdminPage[] | undefined {
    return pages?.map((p) => ({ ...p, sections: fn(p.sections) }));
}

export function useSavePage(tenant: string, slug: string): UseMutationResult<AdminPageRecord, ApiError, PageSeoInput, Rollback<AdminPage[]>> {
    const qc = useQueryClient();
    const queryKey = queryKeys.admin.pages(tenant);
    return useMutation<AdminPageRecord, ApiError, PageSeoInput, Rollback<AdminPage[]>>({
        mutationFn: (input) => savePage(tenant, slug, input),
        onMutate: async (input) => {
            await qc.cancelQueries({ queryKey });
            const prev = qc.getQueryData<AdminPage[]>(queryKey);
            qc.setQueryData<AdminPage[]>(queryKey, (old) => mapPage(old, slug, (p) => ({ ...p, ...input })));
            return { prev };
        },
        onSuccess: () => toast.success("SEO settings saved — the storefront is revalidating."),
        onError: (err, _vars, ctx) => {
            if (ctx?.prev) qc.setQueryData<AdminPage[]>(queryKey, ctx.prev);
            toast.error(`Couldn't save the page: ${err.message}`);
        },
        onSettled: () => qc.invalidateQueries({ queryKey }),
    });
}

export function useAddSection(tenant: string, slug: string): UseMutationResult<PageSection, ApiError, SectionDef, Rollback<AdminPage[]>> {
    const qc = useQueryClient();
    const queryKey = queryKeys.admin.pages(tenant);
    return useMutation<PageSection, ApiError, SectionDef, Rollback<AdminPage[]>>({
        mutationFn: (def) => addSection(tenant, slug, def.type),
        onMutate: async (def) => {
            await qc.cancelQueries({ queryKey });
            const prev = qc.getQueryData<AdminPage[]>(queryKey);
            qc.setQueryData<AdminPage[]>(queryKey, (old) =>
                mapPage(old, slug, (p) => ({
                    ...p,
                    sections: [
                        ...p.sections,
                        {
                            id: `${PENDING_PREFIX}${def.type}-${p.sections.length}`,
                            pageId: p.id,
                            type: def.type,
                            position: p.sections.length,
                            enabled: true,
                            props: { ...def.defaults },
                            variantBProps: null,
                            abSplit: 0,
                            startsAt: null,
                            endsAt: null,
                            updatedAt: new Date().toISOString(),
                        },
                    ],
                })),
            );
            return { prev };
        },
        onSuccess: (_row, def) => toast.success(`${def.label} added to the end of the page.`),
        onError: (err, _vars, ctx) => {
            if (ctx?.prev) qc.setQueryData<AdminPage[]>(queryKey, ctx.prev);
            toast.error(`Couldn't add the section: ${err.message}`);
        },
        onSettled: () => qc.invalidateQueries({ queryKey }),
    });
}

export function usePatchSection(tenant: string): UseMutationResult<PageSection, ApiError, { id: string; patch: SectionPatch }, Rollback<AdminPage[]>> {
    const qc = useQueryClient();
    const queryKey = queryKeys.admin.pages(tenant);
    return useMutation<PageSection, ApiError, { id: string; patch: SectionPatch }, Rollback<AdminPage[]>>({
        mutationFn: ({ id, patch }) => patchSection(tenant, id, patch),
        onMutate: async ({ id, patch }) => {
            await qc.cancelQueries({ queryKey });
            const prev = qc.getQueryData<AdminPage[]>(queryKey);
            qc.setQueryData<AdminPage[]>(queryKey, (old) => mapSections(old, (list) => list.map((s) => (s.id === id ? { ...s, ...patch } : s))));
            return { prev };
        },
        onError: (err, _vars, ctx) => {
            if (ctx?.prev) qc.setQueryData<AdminPage[]>(queryKey, ctx.prev);
            toast.error(`Couldn't update the section: ${err.message}`);
        },
        onSettled: () => qc.invalidateQueries({ queryKey }),
    });
}

export function useReorderSections(tenant: string, slug: string): UseMutationResult<void, ApiError, string[], Rollback<AdminPage[]>> {
    const qc = useQueryClient();
    const queryKey = queryKeys.admin.pages(tenant);
    return useMutation<void, ApiError, string[], Rollback<AdminPage[]>>({
        mutationFn: (ids) => reorderSections(tenant, slug, ids),
        onMutate: async (ids) => {
            await qc.cancelQueries({ queryKey });
            const prev = qc.getQueryData<AdminPage[]>(queryKey);
            qc.setQueryData<AdminPage[]>(queryKey, (old) =>
                mapPage(old, slug, (p) => ({
                    ...p,
                    sections: ids.flatMap((id, position) => {
                        const s = p.sections.find((x) => x.id === id);
                        return s ? [{ ...s, position }] : [];
                    }),
                })),
            );
            return { prev };
        },
        onError: (err, _vars, ctx) => {
            if (ctx?.prev) qc.setQueryData<AdminPage[]>(queryKey, ctx.prev);
            toast.error(`Couldn't reorder sections: ${err.message}`);
        },
        onSettled: () => qc.invalidateQueries({ queryKey }),
    });
}

export function useDeleteSection(tenant: string): UseMutationResult<void, ApiError, string, Rollback<AdminPage[]>> {
    const qc = useQueryClient();
    const queryKey = queryKeys.admin.pages(tenant);
    return useMutation<void, ApiError, string, Rollback<AdminPage[]>>({
        mutationFn: (id) => deleteSection(tenant, id),
        onMutate: async (id) => {
            await qc.cancelQueries({ queryKey });
            const prev = qc.getQueryData<AdminPage[]>(queryKey);
            qc.setQueryData<AdminPage[]>(queryKey, (old) => mapSections(old, (list) => list.filter((s) => s.id !== id)));
            return { prev };
        },
        onSuccess: () => toast.success("Section removed from the page."),
        onError: (err, _vars, ctx) => {
            if (ctx?.prev) qc.setQueryData<AdminPage[]>(queryKey, ctx.prev);
            toast.error(`Couldn't delete the section: ${err.message}`);
        },
        onSettled: () => qc.invalidateQueries({ queryKey }),
    });
}

// ─────────────── Journal ───────────────

export function usePosts(tenant: string): UseQueryResult<Post[], ApiError> {
    return useQuery<Post[], ApiError>({ queryKey: queryKeys.admin.posts(tenant), queryFn: () => fetchPosts(tenant) });
}

export function useSavePost(tenant: string): UseMutationResult<Post, ApiError, { id: string | null; input: PostInput }, Rollback<Post[]>> {
    const qc = useQueryClient();
    const queryKey = queryKeys.admin.posts(tenant);
    return useMutation<Post, ApiError, { id: string | null; input: PostInput }, Rollback<Post[]>>({
        mutationFn: ({ id, input }) => (id ? updatePost(tenant, id, input) : createPost(tenant, input)),
        onMutate: async ({ id, input }) => {
            await qc.cancelQueries({ queryKey });
            const prev = qc.getQueryData<Post[]>(queryKey);
            const now = new Date().toISOString();
            qc.setQueryData<Post[]>(queryKey, (old) => {
                if (!old) return old;
                if (id) {
                    return old.map((p) =>
                        p.id === id ? { ...p, ...input, updatedAt: now, publishedAt: input.status === "published" ? (p.publishedAt ?? now) : null } : p,
                    );
                }
                return [{ ...input, id: `${PENDING_PREFIX}${input.slug}`, publishedAt: input.status === "published" ? now : null, updatedAt: now }, ...old];
            });
            return { prev };
        },
        onSuccess: (post) => toast.success(post.status === "published" ? `"${post.title}" is live.` : `"${post.title}" saved as a draft.`),
        onError: (err, _vars, ctx) => {
            if (ctx?.prev) qc.setQueryData<Post[]>(queryKey, ctx.prev);
            toast.error(`Couldn't save the post: ${err.message}`);
        },
        onSettled: () => qc.invalidateQueries({ queryKey }),
    });
}

export function useDeletePost(tenant: string): UseMutationResult<void, ApiError, string, Rollback<Post[]>> {
    const qc = useQueryClient();
    const queryKey = queryKeys.admin.posts(tenant);
    return useMutation<void, ApiError, string, Rollback<Post[]>>({
        mutationFn: (id) => deletePost(tenant, id),
        onMutate: async (id) => {
            await qc.cancelQueries({ queryKey });
            const prev = qc.getQueryData<Post[]>(queryKey);
            qc.setQueryData<Post[]>(queryKey, (old) => old?.filter((p) => p.id !== id));
            return { prev };
        },
        onSuccess: () => toast.success("Post deleted."),
        onError: (err, _vars, ctx) => {
            if (ctx?.prev) qc.setQueryData<Post[]>(queryKey, ctx.prev);
            toast.error(`Couldn't delete the post: ${err.message}`);
        },
        onSettled: () => qc.invalidateQueries({ queryKey }),
    });
}

// ─────────────── Theme ───────────────

export function useTheme(tenant: string): UseQueryResult<ThemeResponse, ApiError> {
    return useQuery<ThemeResponse, ApiError>({ queryKey: queryKeys.admin.theme(tenant), queryFn: () => fetchTheme(tenant) });
}

export function useSaveTheme(tenant: string): UseMutationResult<ThemeSaveResponse, ApiError, ThemeTokens, Rollback<ThemeResponse>> {
    const qc = useQueryClient();
    const queryKey = queryKeys.admin.theme(tenant);
    return useMutation<ThemeSaveResponse, ApiError, ThemeTokens, Rollback<ThemeResponse>>({
        mutationFn: (tokens) => saveTheme(tenant, tokens),
        onMutate: async (tokens) => {
            await qc.cancelQueries({ queryKey });
            const prev = qc.getQueryData<ThemeResponse>(queryKey);
            qc.setQueryData<ThemeResponse>(queryKey, (old) => (old ? { ...old, tokens } : old));
            return { prev };
        },
        onSuccess: (res) => toast.success(Object.keys(res.tokens).length === 0 ? "Theme reset to brand defaults." : "Theme saved — the storefront is revalidating."),
        onError: (err, _vars, ctx) => {
            if (ctx?.prev) qc.setQueryData<ThemeResponse>(queryKey, ctx.prev);
            toast.error(`Couldn't save the theme: ${err.message}`);
        },
        onSettled: () => qc.invalidateQueries({ queryKey }),
    });
}
