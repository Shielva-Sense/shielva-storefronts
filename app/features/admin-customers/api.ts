import { apiFetch, apiUrl, ApiError } from "@/core/api-client";
import type { CsvDownload, CustomerDetail, CustomersPage, CustomersQuery, Segment, SegmentInput, SegmentRules, SegmentsResponse } from "./types";

export type { CsvDownload, Customer, CustomerBooking, CustomerDetail, CustomerMembership, CustomerOrder, CustomerReview, CustomersPage, CustomersQuery, Segment, SegmentInput, SegmentRules, SegmentsResponse } from "./types";

export async function fetchCustomers(tenant: string, query: CustomersQuery): Promise<CustomersPage> {
    const qs = new URLSearchParams({ sort: query.sort, dir: query.dir, page: String(query.page), size: String(query.size) });
    if (query.q) qs.set("q", query.q);
    if (query.segment) qs.set("segment", query.segment);
    return apiFetch<CustomersPage>(`/admin/customers?${qs.toString()}`, { tenant });
}

export async function fetchCustomer(tenant: string, email: string): Promise<CustomerDetail> {
    return apiFetch<CustomerDetail>(`/admin/customers/${encodeURIComponent(email)}`, { tenant });
}

export async function updateCustomerTags(tenant: string, email: string, tags: string[]): Promise<{ email: string; tags: string[] }> {
    return apiFetch<{ email: string; tags: string[] }>(`/admin/customers/${encodeURIComponent(email)}`, { method: "PATCH", tenant, body: { tags } });
}

export async function fetchSegments(tenant: string): Promise<SegmentsResponse> {
    return apiFetch<SegmentsResponse>("/admin/segments", { tenant });
}

export async function previewSegment(tenant: string, rules: SegmentRules): Promise<{ count: number }> {
    return apiFetch<{ count: number }>("/admin/segments/preview", { method: "POST", tenant, body: rules });
}

export async function createSegment(tenant: string, input: SegmentInput): Promise<Omit<Segment, "count">> {
    return apiFetch<Omit<Segment, "count">>("/admin/segments", { method: "POST", tenant, body: input });
}

export async function deleteSegment(tenant: string, id: string): Promise<void> {
    await apiFetch<{ ok: boolean }>(`/admin/segments/${encodeURIComponent(id)}`, { method: "DELETE", tenant });
}

/**
 * CSV export. A plain <a href> can't send the x-tenant header, and apiFetch parses JSON,
 * so this is the one raw fetch: same-origin cookies + x-tenant, returned as a Blob.
 */
export async function exportSegmentCsv(tenant: string, id: string): Promise<CsvDownload> {
    const res = await fetch(apiUrl(`/admin/segments/${encodeURIComponent(id)}/export.csv`), {
        headers: { accept: "text/csv", "x-tenant": tenant },
        credentials: "same-origin",
    });
    if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string; message?: string } | null;
        throw new ApiError(res.status, data?.error ?? "http_error", data?.message ?? `Export failed (${res.status})`);
    }
    const disposition = res.headers.get("content-disposition") ?? "";
    const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? "segment.csv";
    return { filename, blob: await res.blob() };
}
