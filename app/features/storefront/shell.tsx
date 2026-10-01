import type { ReactNode } from "react";
import { StorefrontLayout } from "@/components/layouts/StorefrontLayout";
import { anton, cormorant, fraunces } from "@/core/fonts";
import { BEAUTY_BRAND, BEAUTY_FREE_SHIPPING_AT } from "@/features/beauty/constants";
import { FASHION_BRAND, FASHION_FREE_SHIPPING_AT } from "@/features/fashion/constants";
import { SALON_BRAND, SALON_FREE_SHIPPING_AT } from "@/features/salon/constants";
import { storefrontChrome } from "./chrome";
import { loadSite } from "./server";
import type { CatalogItem, StoreSlug } from "./types";

const SHELL = {
    beauty: { brand: BEAUTY_BRAND, font: fraunces.variable, freeShippingAt: BEAUTY_FREE_SHIPPING_AT },
    salon: { brand: SALON_BRAND, font: cormorant.variable, freeShippingAt: SALON_FREE_SHIPPING_AT },
    fashion: { brand: FASHION_BRAND, font: anton.variable, freeShippingAt: FASHION_FREE_SHIPPING_AT },
} as const;

export function storeBrand(store: StoreSlug): string {
    return SHELL[store].brand;
}

/** Secondary pages (account, journal) reuse the storefront chrome; section anchors point back home. */
export async function StoreShell({ store, catalog, theme, children }: { store: StoreSlug; catalog?: readonly CatalogItem[]; theme?: Record<string, string>; children: ReactNode }): Promise<React.JSX.Element> {
    const s = SHELL[store];
    const chrome = storefrontChrome({ store, brand: s.brand, site: await loadSite(store), home: false });
    return (
        <StorefrontLayout
            theme={store}
            fontClass={s.font}
            brand={s.brand}
            nav={chrome.nav}
            freeShippingAt={s.freeShippingAt}
            {...(catalog ? { catalog } : {})}
            {...(theme ? { themeTokens: theme } : {})}
            footer={chrome.footer}
        >
            {children}
        </StorefrontLayout>
    );
}
