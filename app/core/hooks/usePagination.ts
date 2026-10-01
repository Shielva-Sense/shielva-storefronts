"use client";

import { useSearchParam } from "./useSearchParam";

export function usePagination(defaultSize = 20): { page: number; size: number; setPage: (p: number) => void } {
    const [pageRaw, setPageRaw] = useSearchParam("page", "1");
    const [sizeRaw] = useSearchParam("size", String(defaultSize));
    const page = Math.max(1, Number.parseInt(pageRaw, 10) || 1);
    const size = Math.min(100, Math.max(1, Number.parseInt(sizeRaw, 10) || defaultSize));
    return { page, size, setPage: (p: number) => setPageRaw(String(p)) };
}
