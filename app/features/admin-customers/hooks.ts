"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient, type UseMutationResult, type UseQueryResult } from "@tanstack/react-query";
import { toast } from "@/components/ui/Toast";
import type { ApiError } from "@/core/api-client";
import { queryKeys } from "@/core/query-keys";
import { createSegment, deleteSegment, exportSegmentCsv, fetchCustomer, fetchCustomers, fetchSegments, previewSegment, updateCustomerTags } from "./api";
import type { CsvDownload, CustomerDetail, CustomersPage, CustomersQuery, Segment, SegmentInput, SegmentRules, SegmentsResponse } from "./types";

export function useCustomers(tenant: string, query: CustomersQuery): UseQueryResult<CustomersPage, ApiError> {
    return useQuery<CustomersPage, ApiError>({
        queryKey: queryKeys.admin.customers(tenant, { ...query }),
        queryFn: () => fetchCustomers(tenant, query),
        placeholderData: keepPreviousData,
    });
}

export function useCustomer(tenant: string, email: string): UseQueryResult<CustomerDetail, ApiError> {
    return useQuery<CustomerDetail, ApiError>({ queryKey: queryKeys.admin.customer(tenant, email), queryFn: () => fetchCustomer(tenant, email) });
}

interface Snapshot<T> {
    prev: T | undefined;
}

/** Optimistic tag edit on the customer profile; list pages resync on settle. */
export function useUpdateCustomerTags(tenant: string, email: string): UseMutationResult<{ email: string; tags: string[] }, ApiError, string[], Snapshot<CustomerDetail>> {
    const qc = useQueryClient();
    const key = queryKeys.admin.customer(tenant, email);
    return useMutation<{ email: string; tags: string[] }, ApiError, string[], Snapshot<CustomerDetail>>({
        mutationFn: (tags) => updateCustomerTags(tenant, email, tags),
        onMutate: async (tags) => {
            await qc.cancelQueries({ queryKey: key });
            const prev = qc.getQueryData<CustomerDetail>(key);
            qc.setQueryData<CustomerDetail>(key, (old) => (old ? { ...old, profile: { ...old.profile, tags } } : old));
            return { prev };
        },
        onError: (err, _tags, ctx) => {
            if (ctx?.prev) qc.setQueryData<CustomerDetail>(key, ctx.prev);
            toast.error(`Couldn't save tags: ${err.message}`);
        },
        onSettled: () => {
            void qc.invalidateQueries({ queryKey: key });
            void qc.invalidateQueries({ queryKey: queryKeys.admin.customers(tenant, {}).slice(0, 3) });
            void qc.invalidateQueries({ queryKey: queryKeys.admin.segments(tenant) });
        },
    });
}

export function useSegments(tenant: string): UseQueryResult<SegmentsResponse, ApiError> {
    return useQuery<SegmentsResponse, ApiError>({ queryKey: queryKeys.admin.segments(tenant), queryFn: () => fetchSegments(tenant) });
}

/**
 * Live audience count for draft rules (a read, even though it is a POST).
 * Key extends queryKeys.admin.segments — query-keys.ts has no dedicated preview key.
 */
export function useSegmentPreview(tenant: string, rules: SegmentRules, enabled: boolean): UseQueryResult<{ count: number }, ApiError> {
    return useQuery<{ count: number }, ApiError>({
        queryKey: queryKeys.admin.segmentPreview(tenant, rules),
        queryFn: () => previewSegment(tenant, rules),
        enabled,
        staleTime: 30_000,
        placeholderData: keepPreviousData,
    });
}

export function useCreateSegment(tenant: string): UseMutationResult<Omit<Segment, "count">, ApiError, SegmentInput & { previewCount: number }, Snapshot<SegmentsResponse>> {
    const qc = useQueryClient();
    const key = queryKeys.admin.segments(tenant);
    return useMutation<Omit<Segment, "count">, ApiError, SegmentInput & { previewCount: number }, Snapshot<SegmentsResponse>>({
        mutationFn: ({ name, rules }) => createSegment(tenant, { name, rules }),
        onMutate: async (input) => {
            await qc.cancelQueries({ queryKey: key });
            const prev = qc.getQueryData<SegmentsResponse>(key);
            qc.setQueryData<SegmentsResponse>(key, (old) =>
                old
                    ? { items: [...old.items, { id: `pending-${Date.now()}`, name: input.name, rules: input.rules, count: input.previewCount }].sort((a, b) => a.name.localeCompare(b.name)) }
                    : old,
            );
            return { prev };
        },
        onError: (err, _input, ctx) => {
            if (ctx?.prev) qc.setQueryData<SegmentsResponse>(key, ctx.prev);
            toast.error(`Couldn't save the segment: ${err.message}`);
        },
        onSuccess: (seg) => toast.success(`Segment "${seg.name}" saved.`),
        onSettled: () => void qc.invalidateQueries({ queryKey: key }),
    });
}

export function useDeleteSegment(tenant: string): UseMutationResult<void, ApiError, Segment, Snapshot<SegmentsResponse>> {
    const qc = useQueryClient();
    const key = queryKeys.admin.segments(tenant);
    return useMutation<void, ApiError, Segment, Snapshot<SegmentsResponse>>({
        mutationFn: (seg) => deleteSegment(tenant, seg.id),
        onMutate: async (seg) => {
            await qc.cancelQueries({ queryKey: key });
            const prev = qc.getQueryData<SegmentsResponse>(key);
            qc.setQueryData<SegmentsResponse>(key, (old) => (old ? { items: old.items.filter((s) => s.id !== seg.id) } : old));
            return { prev };
        },
        onError: (err, _seg, ctx) => {
            if (ctx?.prev) qc.setQueryData<SegmentsResponse>(key, ctx.prev);
            toast.error(`Couldn't delete the segment: ${err.message}`);
        },
        onSuccess: (_res, seg) => toast.success(`Segment "${seg.name}" deleted.`),
        onSettled: () => void qc.invalidateQueries({ queryKey: key }),
    });
}

function saveBlob({ filename, blob }: CsvDownload): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

/** Downloads a segment as CSV (no cache to patch — onError toast only). */
export function useExportSegment(tenant: string): UseMutationResult<CsvDownload, ApiError, Segment> {
    return useMutation<CsvDownload, ApiError, Segment>({
        mutationFn: (seg) => exportSegmentCsv(tenant, seg.id),
        onSuccess: (file, seg) => {
            saveBlob(file);
            toast.success(`Exported ${seg.count} customers from "${seg.name}".`);
        },
        onError: (err) => toast.error(`Export failed: ${err.message}`),
    });
}
