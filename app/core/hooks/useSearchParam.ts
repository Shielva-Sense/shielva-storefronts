"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

/** One URL query param as state (?q=, ?store=, ?status=…). Empty value removes the param. */
export function useSearchParam(key: string, fallback = ""): [string, (value: string) => void] {
    const params = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const value = params.get(key) ?? fallback;
    const set = useCallback(
        (next: string) => {
            const sp = new URLSearchParams(params.toString());
            if (next && next !== fallback) sp.set(key, next);
            else sp.delete(key);
            if (key !== "page") sp.delete("page");
            const qs = sp.toString();
            router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
        },
        [params, router, pathname, key, fallback],
    );
    return [value, set];
}
