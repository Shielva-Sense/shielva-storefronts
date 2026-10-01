"use client";

import { useCallback, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ExternalLink, NotebookPen, Pencil, Plus, Trash2 } from "lucide-react";
import { ListLayout } from "@/components/layouts/ListLayout";
import { Button } from "@/components/ui/Button";
import { confirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, Select } from "@/components/ui/Field";
import { BrandSpinner, ProgressOverlay } from "@/components/ui/ProgressOverlay";
import { StatSection, type Stat } from "@/components/ui/StatSection";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SearchInput, Toolbar } from "@/components/ui/Toolbar";
import { formatDateTime } from "@/core/formatters";
import { useColumnSort, useDebouncedValue, useSearchParam } from "@/core/hooks";
import { useAdmin } from "@/features/admin-session/AdminContext";
import contentStyles from "@/features/admin-content/components/Content.module.scss";
import { PostEditor } from "@/features/admin-content/components/PostEditor";
import { ReadOnlyNotice } from "@/components/ui/ReadOnlyNotice";
import { isPending, POST_STATUS_LABEL, POST_STATUS_TONE, POST_STATUSES } from "@/features/admin-content/constants";
import { useDeletePost, usePosts, useSavePost } from "@/features/admin-content/hooks";
import type { Post } from "@/features/admin-content/types";
import styles from "./Journal.module.scss";

const SORTABLE = ["title", "publishedAt", "updatedAt"] as const;
const NEW_POST = "new";

function deriveStats(posts: readonly Post[]): Stat[] {
    const published = posts.filter((p) => p.status === "published").length;
    const missingSeo = posts.filter((p) => !p.seoTitle || !p.seoDescription).length;
    return [
        { label: "Posts", value: String(posts.length), hint: "Journal articles" },
        { label: "Published", value: String(published), hint: "Live and indexable", tone: "success" },
        { label: "Drafts", value: String(posts.length - published), hint: "Not on the storefront" },
        { label: "Missing SEO meta", value: String(missingSeo), hint: "Falling back to title / excerpt", tone: missingSeo > 0 ? "warning" : "success" },
    ];
}

function sortValue(p: Post, id: string): string {
    if (id === "title") return p.title.toLowerCase();
    if (id === "publishedAt") return p.publishedAt ? p.publishedAt : "";
    return p.updatedAt;
}

export function JournalClient(): React.JSX.Element {
    const { tenant, store, can, me } = useAdmin();
    const canEdit = can("admin");
    const posts = usePosts(tenant);
    const savePost = useSavePost(tenant);
    const { mutate: deletePost } = useDeletePost(tenant);
    const [search, setSearch] = useSearchParam("q");
    const [status, setStatus] = useSearchParam("status");
    const debounced = useDebouncedValue(search);
    const { sort, dir, toggle } = useColumnSort("updatedAt");
    const [editing, setEditing] = useState<string | null>(null);

    const all = useMemo(() => posts.data ?? [], [posts.data]);
    const rows = useMemo(() => {
        const q = debounced.trim().toLowerCase();
        const filtered = all.filter((p) => (!status || p.status === status) && (!q || p.title.toLowerCase().includes(q) || p.slug.includes(q) || p.author.toLowerCase().includes(q)));
        const factor = dir === "asc" ? 1 : -1;
        return [...filtered].sort((a, b) => sortValue(a, sort).localeCompare(sortValue(b, sort)) * factor);
    }, [all, debounced, status, sort, dir]);

    const remove = useCallback(async (post: Post): Promise<void> => {
        const ok = await confirmDialog({
            title: `Delete "${post.title}"?`,
            description: post.status === "published" ? "The post is removed from the storefront journal and its URL will return 404. This cannot be undone." : "The draft is deleted permanently.",
            confirmLabel: "Delete post",
            danger: true,
        });
        if (ok) deletePost(post.id);
    }, [deletePost]);

    const columns = useMemo<ColumnDef<Post, unknown>[]>(
        () => [
            {
                id: "title",
                header: "Title",
                cell: ({ row }) => (
                    <div className={styles.titleCell}>
                        <span className={styles.title}>{row.original.title}</span>
                        <span className={styles.excerpt}>{row.original.excerpt}</span>
                    </div>
                ),
            },
            { id: "slug", header: "Slug", cell: ({ row }) => <code className={styles.slug}>{row.original.slug}</code> },
            {
                id: "status",
                header: "Status",
                cell: ({ row }) => <StatusBadge tone={POST_STATUS_TONE[row.original.status]}>{POST_STATUS_LABEL[row.original.status]}</StatusBadge>,
            },
            {
                id: "publishedAt",
                header: "Published",
                cell: ({ row }) => (row.original.publishedAt ? formatDateTime(row.original.publishedAt) : <span className={styles.muted}>Not published</span>),
            },
            { id: "updatedAt", header: "Updated", cell: ({ row }) => formatDateTime(row.original.updatedAt) },
            {
                id: "actions",
                header: () => <span className="visually-hidden">Actions</span>,
                cell: ({ row }) => {
                    const p = row.original;
                    const pending = isPending(p.id);
                    return (
                        <div className={styles.actions}>
                            {p.status === "published" && !pending ? (
                                <a href={`/${store.slug}/journal/${p.slug}`} target="_blank" rel="noopener noreferrer" className={styles.viewLink}>
                                    View post <ExternalLink size={13} aria-hidden="true" />
                                    <span className="visually-hidden">{`"${p.title}" (opens in a new tab)`}</span>
                                </a>
                            ) : null}
                            <Button variant="secondary" size="sm" leftIcon={<Pencil size={14} aria-hidden="true" />} onClick={() => setEditing(p.id)} disabled={pending} aria-label={`Edit "${p.title}"`}>
                                Edit
                            </Button>
                            <button type="button" className={styles.deleteBtn} onClick={() => void remove(p)} disabled={!canEdit || pending} aria-label={`Delete "${p.title}"`}>
                                <Trash2 size={15} aria-hidden="true" />
                            </button>
                        </div>
                    );
                },
            },
        ],
        [store.slug, canEdit, remove],
    );

    const editingPost = editing && editing !== NEW_POST ? (all.find((p) => p.id === editing) ?? null) : null;

    let body: React.ReactNode;
    if (posts.isPending) body = <BrandSpinner mode="content" message="Loading journal posts…" />;
    else if (posts.isError)
        body = (
            <div className={contentStyles.errorBox} role="alert">
                <p>Couldn&apos;t load journal posts: {posts.error.message}</p>
                <Button variant="secondary" onClick={() => void posts.refetch()}>Try again</Button>
            </div>
        );
    else if (all.length === 0)
        body = (
            <EmptyState
                icon={<NotebookPen size={32} aria-hidden="true" />}
                title="No journal posts yet"
                description="The journal is this storefront's editorial SEO engine: each post is an indexable page that answers a real customer question and links to products or services. Write the first one to start earning long-tail search traffic."
                action={canEdit ? <Button leftIcon={<Plus size={14} aria-hidden="true" />} onClick={() => setEditing(NEW_POST)}>Write the first post</Button> : undefined}
            />
        );
    else if (rows.length === 0)
        body = <EmptyState title="No posts match" description="Nothing matches the current search or status filter. Clear them to see every post." action={<Button variant="secondary" onClick={() => { setSearch(""); setStatus(""); }}>Clear filters</Button>} />;
    else body = <DataTable columns={columns} data={rows} getRowId={(p) => p.id} caption="Journal posts" sort={{ id: sort, dir, sortable: SORTABLE, onToggle: toggle }} />;

    return (
        <ListLayout
            title="Journal & SEO"
            subtitle="Editorial posts rendered at /journal on the storefront. Published posts are indexable immediately; drafts stay private."
            headerActions={
                <Button leftIcon={<Plus size={14} aria-hidden="true" />} onClick={() => setEditing(NEW_POST)} disabled={!canEdit}>
                    New post
                </Button>
            }
            stats={<StatSection stats={deriveStats(all)} show={posts.isSuccess && all.length > 0} />}
            aboveContent={canEdit ? undefined : <ReadOnlyNotice what="journal posts" />}
            toolbar={
                all.length > 0 ? (
                    <Toolbar
                        label="Filter posts"
                        start={<SearchInput label="Search posts by title, slug or author" value={search} onChange={setSearch} />}
                        end={
                            <Field label="Status" hideLabel>
                                {(id) => (
                                    <Select id={id} value={status} onChange={(e) => setStatus(e.target.value)}>
                                        <option value="">All statuses</option>
                                        {POST_STATUSES.map((s) => (
                                            <option key={s} value={s}>{POST_STATUS_LABEL[s]}</option>
                                        ))}
                                    </Select>
                                )}
                            </Field>
                        }
                    />
                ) : undefined
            }
        >
            {body}
            {editing ? (
                <PostEditor
                    key={editing}
                    post={editingPost}
                    defaultAuthor={me.name}
                    canEdit={canEdit}
                    saving={savePost.isPending}
                    onClose={() => setEditing(null)}
                    onSave={(input) => savePost.mutate({ id: editingPost?.id ?? null, input }, { onSuccess: () => setEditing(null) })}
                />
            ) : null}
            <ProgressOverlay open={savePost.isPending} message="Saving the post…" detail="The storefront journal revalidates as soon as it lands." />
        </ListLayout>
    );
}
