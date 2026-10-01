"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { CatalogItem } from "./types";

interface CatalogValue {
    /** Live price in dollars (falls back to the built-in price when the API is unavailable). */
    price: (sku: string, fallback: number) => number;
    inStock: (sku: string) => boolean;
    stock: (sku: string) => number | null;
}

const CatalogContext = createContext<CatalogValue>({ price: (_s, f) => f, inStock: () => true, stock: () => null });

export function CatalogProvider({ items, children }: { items: readonly CatalogItem[]; children: ReactNode }): React.JSX.Element {
    const value = useMemo<CatalogValue>(() => {
        const bySku = new Map(items.map((i) => [i.sku, i]));
        return {
            price: (sku, fallback) => {
                const hit = bySku.get(sku);
                return hit ? hit.priceCents / 100 : fallback;
            },
            inStock: (sku) => bySku.get(sku)?.inStock ?? true,
            stock: (sku) => bySku.get(sku)?.inventoryQty ?? null,
        };
    }, [items]);
    return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): CatalogValue {
    return useContext(CatalogContext);
}

