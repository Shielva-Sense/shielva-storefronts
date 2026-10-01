/**
 * SOLE owner of browser → API calls: same-origin /api/v1 (proxied), cookies, CSRF
 * double-submit header, storefront / tenant scoping headers, error mapping.
 */
export class ApiError extends Error {
    constructor(
        readonly status: number,
        readonly code: string,
        message: string,
    ) {
        super(message);
    }
}

export interface ApiOptions {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: unknown;
    /** Raw upload (e.g. a photo) — sent as-is with the file's own content type. */
    file?: Blob;
    /** Public storefront scope (x-storefront). */
    storefront?: string;
    /** Admin tenant scope (x-tenant) — verified server-side against memberships. */
    tenant?: string;
    signal?: AbortSignal;
    keepalive?: boolean;
}

const CSRF_COOKIE = "sf_csrf";
let csrfBootstrap: Promise<void> | null = null;

function readCookie(name: string): string | null {
    if (typeof document === "undefined") return null;
    const hit = document.cookie.split("; ").find((c) => c.startsWith(`${name}=`));
    return hit ? decodeURIComponent(hit.slice(name.length + 1)) : null;
}

async function ensureCsrf(): Promise<string> {
    const existing = readCookie(CSRF_COOKIE);
    if (existing) return existing;
    csrfBootstrap ??= fetch("/api/v1/session", { credentials: "same-origin" }).then(() => undefined);
    await csrfBootstrap;
    csrfBootstrap = null;
    return readCookie(CSRF_COOKIE) ?? "";
}

export async function apiFetch<T>(path: string, opts: ApiOptions = {}): Promise<T> {
    const method = opts.method ?? "GET";
    const headers: Record<string, string> = { accept: "application/json" };
    if (opts.storefront) headers["x-storefront"] = opts.storefront;
    if (opts.tenant) headers["x-tenant"] = opts.tenant;
    if (method !== "GET") headers["x-csrf-token"] = await ensureCsrf();
    if (opts.body !== undefined) headers["content-type"] = "application/json";
    if (opts.file) headers["content-type"] = opts.file.type || "application/octet-stream";

    const res = await fetch(`/api/v1${path}`, {
        method,
        headers,
        credentials: "same-origin",
        ...(opts.body !== undefined ? { body: JSON.stringify(opts.body) } : opts.file ? { body: opts.file } : {}),
        ...(opts.signal ? { signal: opts.signal } : {}),
        ...(opts.keepalive ? { keepalive: true } : {}),
    });
    if (res.status === 204) return undefined as T;
    const data: unknown = await res.json().catch(() => null);
    if (!res.ok) {
        const err = (data ?? {}) as { error?: string; message?: string };
        throw new ApiError(res.status, err.error ?? "http_error", err.message ?? `Request failed (${res.status})`);
    }
    return data as T;
}

/** Plain URL for downloads (CSV export) — same-origin, cookies attached by the browser. */
export function apiUrl(path: string): string {
    return `/api/v1${path}`;
}
