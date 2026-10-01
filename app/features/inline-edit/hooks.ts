"use client";

import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { toast } from "@/components/ui/Toast";
import type { ApiError } from "@/core/api-client";
import { queryKeys } from "@/core/query-keys";
import type { SiteChrome } from "@/features/storefront/site";
import { publishChanges, replaceProductPhoto, saveSectionLayout, saveSiteChrome, type SectionLayout } from "./api";
import type { InlineChange, PublishSummary } from "./types";

type Failure = ApiError | Error;

/**
 * Inline-edit mutations. The edited text is already on screen (that IS the optimistic state);
 * each hook keeps the admin caches honest: cancel → snapshot → rollback on error → invalidate.
 */
function useAdminCacheGuard(store: string): {
    snapshot: () => Promise<{ pages: unknown; products: unknown }>;
    rollback: (ctx: { pages: unknown; products: unknown } | undefined) => void;
    invalidate: () => Promise<void>;
} {
    const qc = useQueryClient();
    const keys = [queryKeys.admin.pages(store), queryKeys.admin.products(store)] as const;
    return {
        snapshot: async () => {
            await Promise.all(keys.map((queryKey) => qc.cancelQueries({ queryKey })));
            return { pages: qc.getQueryData<unknown>(keys[0]), products: qc.getQueryData<unknown>(keys[1]) };
        },
        rollback: (ctx) => {
            if (ctx?.pages !== undefined) qc.setQueryData<unknown>(keys[0], ctx.pages);
            if (ctx?.products !== undefined) qc.setQueryData<unknown>(keys[1], ctx.products);
        },
        invalidate: async () => {
            await Promise.all(keys.map((queryKey) => qc.invalidateQueries({ queryKey })));
        },
    };
}

type Snapshot = { pages: unknown; products: unknown };

export function usePublishInlineChanges(store: string, site: SiteChrome): UseMutationResult<PublishSummary, Failure, readonly InlineChange[], Snapshot> {
    const guard = useAdminCacheGuard(store);
    return useMutation<PublishSummary, Failure, readonly InlineChange[], Snapshot>({
        mutationFn: (changes) => publishChanges(store, changes, site),
        onMutate: guard.snapshot,
        onError: (err, _vars, ctx) => {
            guard.rollback(ctx);
            toast.error(`Couldn't publish your changes: ${err.message}`);
        },
        onSettled: guard.invalidate,
    });
}

export function useReplaceProductPhoto(store: string): UseMutationResult<void, Failure, { handle: string; file: File }, Snapshot> {
    const guard = useAdminCacheGuard(store);
    return useMutation<void, Failure, { handle: string; file: File }, Snapshot>({
        mutationFn: ({ handle, file }) => replaceProductPhoto(store, handle, file),
        onMutate: guard.snapshot,
        onError: (err, _vars, ctx) => {
            guard.rollback(ctx);
            toast.error(`Couldn't upload the photo: ${err.message}`);
        },
        onSettled: guard.invalidate,
    });
}

export function useSaveSiteChrome(store: string): UseMutationResult<void, Failure, SiteChrome, Snapshot> {
    const guard = useAdminCacheGuard(store);
    return useMutation<void, Failure, SiteChrome, Snapshot>({
        mutationFn: (site) => saveSiteChrome(store, site),
        onMutate: guard.snapshot,
        onError: (err, _vars, ctx) => {
            guard.rollback(ctx);
            toast.error(`Couldn't save the menu: ${err.message}`);
        },
        onSettled: guard.invalidate,
    });
}

export function useSaveSectionLayout(store: string): UseMutationResult<void, Failure, SectionLayout, Snapshot> {
    const guard = useAdminCacheGuard(store);
    return useMutation<void, Failure, SectionLayout, Snapshot>({
        mutationFn: (layout) => saveSectionLayout(store, layout),
        onMutate: guard.snapshot,
        onError: (err, _vars, ctx) => {
            guard.rollback(ctx);
            toast.error(`Couldn't save the sections: ${err.message}`);
        },
        onSettled: guard.invalidate,
    });
}
