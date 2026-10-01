import type { Metadata } from "next";
import { JournalIndex } from "@/features/journal/components/Journal";
import { pageMetadata } from "@/core/seo";
import { loadPosts } from "@/features/storefront/server";
import { StoreShell, storeBrand } from "@/features/storefront/shell";

export const revalidate = 60;

export function generateMetadata(): Metadata {
    return pageMetadata({ title: `Journal — ${storeBrand("salon")}`, description: `Guides and stories from ${storeBrand("salon")}.`, path: "/salon/journal", keywords: [] });
}

export default async function JournalPage(): Promise<React.JSX.Element> {
    const posts = await loadPosts("salon");
    return (
        <StoreShell store="salon">
            <JournalIndex store="salon" posts={posts} />
        </StoreShell>
    );
}
