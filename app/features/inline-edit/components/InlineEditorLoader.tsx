"use client";

import dynamic from "next/dynamic";
import type { SiteChrome } from "@/features/storefront/site";
import type { StoreSlug } from "@/features/storefront/types";

// Only admins (session cookie present) ever download the editor.
const InlineEditor = dynamic(async () => (await import("./InlineEditor")).InlineEditor, { ssr: false });

export function InlineEditorLoader({ store, site }: { store: StoreSlug; site: SiteChrome }): React.JSX.Element {
    return <InlineEditor store={store} site={site} />;
}
