import type { Metadata } from "next";
import { JournalIndex } from "@/features/journal/components/Journal";
import { pageMetadata } from "@/core/seo";
import { loadPosts } from "@/features/storefront/server";
import { StoreShell, storeBrand } from "@/features/storefront/shell";

export const revalidate = 60;

export function generateMetadata(): Metadata {
    return pageMetadata({ title: `Journal — ${storeBrand("beauty")}`, description: `Guides and stories from ${storeBrand("beauty")}.`, path: "/beauty/journal", keywords: [] });
}

export default async function JournalPage(): Promise<React.JSX.Element> {
    const posts = await loadPosts("beauty");
    return (
        <StoreShell store="beauty">
            <JournalIndex store="beauty" posts={posts} />
        </StoreShell>
    );
}
