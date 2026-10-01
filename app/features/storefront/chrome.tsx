import type { ReactNode } from "react";
import { StoreFooter } from "@/components/layouts/StoreFooter";
import { siteEditAttrs, type EditAttrs } from "@/features/inline-edit/markers";
import { absoluteHref, NEWSLETTER, type SiteChrome } from "./site";
import type { StoreSlug } from "./types";

interface ChromeOptions {
    store: StoreSlug;
    brand: string;
    site: SiteChrome;
    /** The storefront home (in-page anchors resolve locally) vs. account / journal pages. */
    home: boolean;
    editor?: boolean;
}

/** Header nav + footer for `StorefrontLayout`, from the stored (or default) site chrome. */
export function storefrontChrome({ store, brand, site, home, editor = false }: ChromeOptions): { nav: { href: string; label: string; edit?: EditAttrs }[]; footer: ReactNode } {
    const href = (h: string): string => (home ? h : absoluteHref(store, h));
    const nav = site.nav.map((n, i) => ({ href: href(n.href), label: n.label, edit: siteEditAttrs(editor, `nav.${i}.label`, n.label) }));
    if (!home && !site.nav.some((n) => n.href === `/${store}/journal`)) nav.push({ href: `/${store}/journal`, label: "Journal", edit: {} });
    return { nav, footer: <StoreFooter brand={brand} footer={site.footer} newsletter={NEWSLETTER[store]} newsletterCta={site.labels.newsletterCta} href={href} editor={editor} /> };
}
