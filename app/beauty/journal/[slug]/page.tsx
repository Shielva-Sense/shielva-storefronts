import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JournalPost } from "@/features/journal/components/Journal";
import { pageMetadata } from "@/core/seo";
import { loadPost } from "@/features/storefront/server";
import { StoreShell } from "@/features/storefront/shell";

export const revalidate = 60;

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const post = await loadPost("beauty", slug);
    if (!post) return { title: "Not found" };
    return pageMetadata({ title: post.seoTitle ?? post.title, description: post.seoDescription ?? post.excerpt, path: `/beauty/journal/${post.slug}`, keywords: [] });
}

export default async function JournalPostPage({ params }: Props): Promise<React.JSX.Element> {
    const { slug } = await params;
    const post = await loadPost("beauty", slug);
    if (!post) notFound();
    return (
        <StoreShell store="beauty">
            <JournalPost store="beauty" post={post} />
        </StoreShell>
    );
}
