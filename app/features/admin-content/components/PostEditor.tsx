"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Eye, PenLine } from "lucide-react";
import { BrandSpinner } from "@/components/ui/ProgressOverlay";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { POST_STATUS_LABEL, POST_STATUSES, SEO_LIMITS, slugify, SLUG_RE } from "../constants";
import type { Post, PostInput, PostStatus } from "../types";
import { LengthCounter } from "./LengthCounter";
import styles from "./PageBuilder.module.scss";
import editorStyles from "./PostEditor.module.scss";

const MarkdownPreview = dynamic(() => import("./MarkdownPreview"), {
    ssr: false,
    loading: () => <BrandSpinner mode="content" message="Rendering preview…" />,
});

interface Draft {
    title: string;
    slug: string;
    excerpt: string;
    author: string;
    status: PostStatus;
    seoTitle: string;
    seoDescription: string;
    bodyMd: string;
}

interface PostEditorProps {
    post: Post | null;
    defaultAuthor: string;
    canEdit: boolean;
    saving: boolean;
    onClose: () => void;
    onSave: (input: PostInput) => void;
}

function toDraft(post: Post | null, author: string): Draft {
    return {
        title: post?.title ?? "",
        slug: post?.slug ?? "",
        excerpt: post?.excerpt ?? "",
        author: post?.author ?? author,
        status: post?.status ?? "draft",
        seoTitle: post?.seoTitle ?? "",
        seoDescription: post?.seoDescription ?? "",
        bodyMd: post?.bodyMd ?? "",
    };
}

function between(value: string, min: number, max: number, label: string): string | undefined {
    const n = value.trim().length;
    return n < min || n > max ? `${label} needs ${min}–${max} characters (currently ${n}).` : undefined;
}

function validate(d: Draft): Partial<Record<keyof Draft, string>> {
    const e: Partial<Record<keyof Draft, string>> = {};
    const title = between(d.title, SEO_LIMITS.postTitle.min, SEO_LIMITS.postTitle.max, "Title");
    if (title) e.title = title;
    if (!SLUG_RE.test(d.slug) || d.slug.length > 80) e.slug = "Use lowercase letters and numbers separated by single hyphens, e.g. balayage-aftercare.";
    const excerpt = between(d.excerpt, SEO_LIMITS.excerpt.min, SEO_LIMITS.excerpt.max, "Excerpt");
    if (excerpt) e.excerpt = excerpt;
    const author = between(d.author, SEO_LIMITS.author.min, SEO_LIMITS.author.max, "Author");
    if (author) e.author = author;
    if (d.seoTitle.length > SEO_LIMITS.seoTitle.max) e.seoTitle = `Keep it under ${SEO_LIMITS.seoTitle.max} characters.`;
    if (d.seoDescription.length > SEO_LIMITS.seoDescription.max) e.seoDescription = `Keep it under ${SEO_LIMITS.seoDescription.max} characters.`;
    const n = d.bodyMd.length;
    if (n < SEO_LIMITS.body.min || n > SEO_LIMITS.body.max) e.bodyMd = `The article body needs at least ${SEO_LIMITS.body.min} characters.`;
    return e;
}

const describe = (...ids: (string | undefined)[]): string => ids.filter(Boolean).join(" ");

/** Create / edit a journal post. Mount with a key so the draft resets per post. */
export function PostEditor({ post, defaultAuthor, canEdit, saving, onClose, onSave }: PostEditorProps): React.JSX.Element {
    const [draft, setDraft] = useState<Draft>(() => toDraft(post, defaultAuthor));
    const [slugTouched, setSlugTouched] = useState(post !== null);
    const [preview, setPreview] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const errors = validate(draft);
    const invalid = Object.keys(errors).length > 0;
    const show = (k: keyof Draft): string | undefined => (submitted ? errors[k] : undefined);
    const set = <K extends keyof Draft>(key: K, value: Draft[K]): void => setDraft((d) => ({ ...d, [key]: value }));

    const setTitle = (title: string): void => setDraft((d) => ({ ...d, title, slug: slugTouched ? d.slug : slugify(title) }));

    const save = (): void => {
        setSubmitted(true);
        if (invalid || !canEdit) return;
        onSave({
            title: draft.title.trim(),
            slug: draft.slug,
            excerpt: draft.excerpt.trim(),
            author: draft.author.trim(),
            status: draft.status,
            bodyMd: draft.bodyMd,
            seoTitle: draft.seoTitle.trim() || null,
            seoDescription: draft.seoDescription.trim() || null,
        });
    };

    return (
        <Modal
            open
            size="lg"
            onClose={onClose}
            title={post ? `Edit "${post.title}"` : "New journal post"}
            description="Journal posts are indexed pages that answer customer questions and link back to products and services."
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={save} disabled={!canEdit || saving || (submitted && invalid)}>
                        {draft.status === "published" ? "Save & publish" : "Save draft"}
                    </Button>
                </>
            }
        >
            <div className={styles.editor}>
                <div className={styles.twoCol}>
                    <Field label="Title" required error={show("title")}>
                        {(id, d) => <Input id={id} value={draft.title} onChange={(e) => setTitle(e.target.value)} aria-describedby={d} aria-invalid={Boolean(show("title"))} aria-required="true" disabled={!canEdit} />}
                    </Field>
                    <Field label="Slug" required help={slugTouched ? "Changing a published slug breaks existing links." : "Generated from the title until you edit it."} error={show("slug")}>
                        {(id, d) => (
                            <Input
                                id={id}
                                value={draft.slug}
                                onChange={(e) => {
                                    setSlugTouched(true);
                                    set("slug", e.target.value.toLowerCase());
                                }}
                                aria-describedby={d}
                                aria-invalid={Boolean(show("slug"))}
                                aria-required="true"
                                spellCheck={false}
                                disabled={!canEdit}
                            />
                        )}
                    </Field>
                </div>
                <Field label="Excerpt" required help="Shown on the journal index and as the default meta description." error={show("excerpt")}>
                    {(id, d) => <Textarea id={id} rows={2} value={draft.excerpt} onChange={(e) => set("excerpt", e.target.value)} aria-describedby={d} aria-invalid={Boolean(show("excerpt"))} aria-required="true" disabled={!canEdit} />}
                </Field>
                <div className={styles.twoCol}>
                    <Field label="Author" required error={show("author")}>
                        {(id, d) => <Input id={id} value={draft.author} onChange={(e) => set("author", e.target.value)} aria-describedby={d} aria-invalid={Boolean(show("author"))} aria-required="true" disabled={!canEdit} />}
                    </Field>
                    <Field label="Status" help="Published posts appear on the storefront journal immediately.">
                        {(id, d) => (
                            <Select id={id} value={draft.status} onChange={(e) => set("status", e.target.value === "published" ? "published" : "draft")} aria-describedby={d} disabled={!canEdit}>
                                {POST_STATUSES.map((s) => (
                                    <option key={s} value={s}>{POST_STATUS_LABEL[s]}</option>
                                ))}
                            </Select>
                        )}
                    </Field>
                </div>
                <fieldset className={styles.fieldset}>
                    <legend className={styles.legend}>Search appearance (optional)</legend>
                    <Field label="SEO title" help="Falls back to the post title." error={show("seoTitle")}>
                        {(id, d) => (
                            <>
                                <Input id={id} value={draft.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} aria-describedby={describe(d, `${id}-count`)} aria-invalid={Boolean(show("seoTitle"))} disabled={!canEdit} />
                                <LengthCounter id={`${id}-count`} length={draft.seoTitle.trim().length} min={SEO_LIMITS.seoTitle.min} max={SEO_LIMITS.seoTitle.max} />
                            </>
                        )}
                    </Field>
                    <Field label="SEO description" help="Falls back to the excerpt." error={show("seoDescription")}>
                        {(id, d) => (
                            <>
                                <Textarea id={id} rows={2} value={draft.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} aria-describedby={describe(d, `${id}-count`)} aria-invalid={Boolean(show("seoDescription"))} disabled={!canEdit} />
                                <LengthCounter id={`${id}-count`} length={draft.seoDescription.trim().length} min={SEO_LIMITS.seoDescription.min} max={SEO_LIMITS.seoDescription.max} />
                            </>
                        )}
                    </Field>
                </fieldset>
                <div className={editorStyles.bodyHead}>
                    <p className={editorStyles.bodyLabel} id="post-body-mode">Article body (Markdown)</p>
                    <Button
                        variant="ghost"
                        size="sm"
                        aria-pressed={preview}
                        leftIcon={preview ? <PenLine size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
                        onClick={() => setPreview((p) => !p)}
                    >
                        {preview ? "Back to writing" : "Preview"}
                    </Button>
                </div>
                {preview ? (
                    <MarkdownPreview source={draft.bodyMd} />
                ) : (
                    <Field label="Body" hideLabel required help="Use ## for section headings, - for lists, **bold** and [links](/path)." error={show("bodyMd")}>
                        {(id, d) => <Textarea id={id} rows={14} className={editorStyles.body} value={draft.bodyMd} onChange={(e) => set("bodyMd", e.target.value)} aria-describedby={describe(d, "post-body-mode")} aria-invalid={Boolean(show("bodyMd"))} aria-required="true" disabled={!canEdit} />}
                    </Field>
                )}
            </div>
        </Modal>
    );
}
