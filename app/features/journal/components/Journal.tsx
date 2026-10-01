import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { JsonLd } from "@/components/ui/JsonLd";
import { formatDateTime } from "@/core/formatters";
import { breadcrumbSchema } from "@/core/seo";
import { absoluteUrl } from "@/core/site";
import { storeBrand } from "@/features/storefront/shell";
import type { Post, PostSummary, StoreSlug } from "@/features/storefront/types";
import styles from "./Journal.module.scss";

export function JournalIndex({ store, posts }: { store: StoreSlug; posts: readonly PostSummary[] }): React.JSX.Element {
    return (
        <div className={`container ${styles.page}`}>
            <JsonLd data={breadcrumbSchema([{ name: storeBrand(store), path: `/${store}` }, { name: "Journal", path: `/${store}/journal` }])} />
            <header className={styles.head}>
                <p className="eyebrow">Journal</p>
                <h1 className={`display ${styles.title}`}>Notes from {storeBrand(store)}</h1>
            </header>
            {posts.length === 0 ? (
                <p className={styles.muted}>New stories are on the way.</p>
            ) : (
                <ul className={styles.list}>
                    {posts.map((p) => (
                        <li key={p.slug}>
                            <Link href={`/${store}/journal/${p.slug}`} className={styles.card}>
                                <h2 className={styles.cardTitle}>{p.title}</h2>
                                <p className={styles.muted}>{p.excerpt}</p>
                                <p className={styles.meta}>{p.author}{p.publishedAt ? ` · ${formatDateTime(p.publishedAt)}` : ""}</p>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export function JournalPost({ store, post }: { store: StoreSlug; post: Post }): React.JSX.Element {
    const url = absoluteUrl(`/${store}/journal/${post.slug}`);
    return (
        <article className={`container ${styles.page} ${styles.article}`}>
            <JsonLd
                data={{
                    "@context": "https://schema.org",
                    "@type": "Article",
                    headline: post.title,
                    description: post.excerpt,
                    author: { "@type": "Person", name: post.author },
                    publisher: { "@type": "Organization", name: storeBrand(store) },
                    datePublished: post.publishedAt,
                    dateModified: post.updatedAt,
                    mainEntityOfPage: url,
                }}
            />
            <JsonLd data={breadcrumbSchema([{ name: storeBrand(store), path: `/${store}` }, { name: "Journal", path: `/${store}/journal` }, { name: post.title, path: `/${store}/journal/${post.slug}` }])} />
            <nav aria-label="Breadcrumb" className={styles.crumbs}>
                <Link href={`/${store}`}>{storeBrand(store)}</Link> / <Link href={`/${store}/journal`}>Journal</Link>
            </nav>
            <header className={styles.head}>
                <h1 className={`display ${styles.title}`}>{post.title}</h1>
                <p className={styles.meta}>{post.author}{post.publishedAt ? ` · ${formatDateTime(post.publishedAt)}` : ""}</p>
            </header>
            <div className={styles.prose}>
                {/* react-markdown renders to React elements; raw HTML in the source is NOT rendered. */}
                <ReactMarkdown>{post.bodyMd}</ReactMarkdown>
            </div>
            <Link href={`/${store}`} className={styles.back}>Shop {storeBrand(store)}</Link>
        </article>
    );
}
