import "server-only";

const API_ORIGIN = process.env.API_ORIGIN ?? "http://127.0.0.1:8040";

/**
 * Server-side read of public storefront data. Returns null when the API is unreachable
 * so storefronts keep rendering from their built-in defaults (graceful degradation).
 */
export async function serverFetch<T>(path: string, storefront: string, revalidate = 30): Promise<T | null> {
    try {
        const res = await fetch(`${API_ORIGIN}/api/v1${path}`, {
            headers: { "x-storefront": storefront, accept: "application/json" },
            next: { revalidate, tags: [`store:${storefront}`] },
            signal: AbortSignal.timeout(4000),
        });
        if (!res.ok) return null;
        return (await res.json()) as T;
    } catch {
        return null;
    }
}
