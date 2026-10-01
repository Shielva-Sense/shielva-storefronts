"use client";

import { useSearchParam } from "./useSearchParam";

export type SortDir = "asc" | "desc";

export function useColumnSort(defaultSort: string, defaultDir: SortDir = "desc"): { sort: string; dir: SortDir; toggle: (id: string) => void } {
    const [sort, setSort] = useSearchParam("sort", defaultSort);
    const [dirRaw, setDir] = useSearchParam("dir", defaultDir);
    const dir: SortDir = dirRaw === "asc" ? "asc" : "desc";
    return {
        sort,
        dir,
        toggle: (id: string) => {
            if (id === sort) setDir(dir === "asc" ? "desc" : "asc");
            else setSort(id);
        },
    };
}
