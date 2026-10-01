"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/Field";
import { CANONICAL_RE, SCHEMA_TOGGLES, SEO_LIMITS } from "../constants";
import type { AdminPage, PageSeoInput, SchemaToggles } from "../types";
import { LengthCounter } from "./LengthCounter";
import { SerpPreview } from "./SerpPreview";
import styles from "./PageBuilder.module.scss";

interface SeoPanelProps {
    page: AdminPage;
    canEdit: boolean;
    saving: boolean;
    onSave: (input: PageSeoInput) => void;
}

function pick(page: AdminPage): PageSeoInput {
    return {
        title: page.title,
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
        canonicalPath: page.canonicalPath,
        schemaToggles: { ...page.schemaToggles },
        collectionCopy: page.collectionCopy,
    };
}

function validate(d: PageSeoInput): Partial<Record<keyof PageSeoInput, string>> {
    const e: Partial<Record<keyof PageSeoInput, string>> = {};
    const t = d.title.trim().length;
    if (t < SEO_LIMITS.pageTitle.min || t > SEO_LIMITS.pageTitle.max) e.title = `Use ${SEO_LIMITS.pageTitle.min}–${SEO_LIMITS.pageTitle.max} characters.`;
    const st = d.seoTitle.trim().length;
    if (st < SEO_LIMITS.seoTitle.min || st > SEO_LIMITS.seoTitle.max) e.seoTitle = `Must be ${SEO_LIMITS.seoTitle.min}–${SEO_LIMITS.seoTitle.max} characters to save.`;
    const sd = d.seoDescription.trim().length;
    if (sd < SEO_LIMITS.seoDescription.min || sd > SEO_LIMITS.seoDescription.max) e.seoDescription = `Must be ${SEO_LIMITS.seoDescription.min}–${SEO_LIMITS.seoDescription.max} characters to save.`;
    if (!CANONICAL_RE.test(d.canonicalPath) || d.canonicalPath.length > 120) e.canonicalPath = "Start with / and use lowercase letters, numbers, - and / only.";
    if (d.collectionCopy.length > SEO_LIMITS.collectionCopy.max) e.collectionCopy = `Keep it under ${SEO_LIMITS.collectionCopy.max} characters.`;
    return e;
}

const describe = (...ids: (string | undefined)[]): string => ids.filter(Boolean).join(" ");

/** SEO & structured-data settings for one page, with a live SERP snippet. Mount with key={page.id}. */
export function SeoPanel({ page, canEdit, saving, onSave }: SeoPanelProps): React.JSX.Element {
    const [draft, setDraft] = useState<PageSeoInput>(() => pick(page));
    const [touched, setTouched] = useState(false);
    const errors = validate(draft);
    const invalid = Object.keys(errors).length > 0;
    const dirty = JSON.stringify(draft) !== JSON.stringify(pick(page));

    const set = <K extends keyof PageSeoInput>(key: K, value: PageSeoInput[K]): void => setDraft((d) => ({ ...d, [key]: value }));
    const toggle = (key: keyof SchemaToggles, value: boolean): void => setDraft((d) => ({ ...d, schemaToggles: { ...d.schemaToggles, [key]: value } }));
    const show = (key: keyof PageSeoInput): string | undefined => (touched ? errors[key] : undefined);

    const submit = (e: FormEvent<HTMLFormElement>): void => {
        e.preventDefault();
        setTouched(true);
        if (invalid || !canEdit) return;
        onSave({ ...draft, title: draft.title.trim(), seoTitle: draft.seoTitle.trim(), seoDescription: draft.seoDescription.trim() });
    };

    return (
        <section className={styles.panel} aria-labelledby="seo-heading">
            <header className={styles.panelHead}>
                <div>
                    <h2 id="seo-heading" className={styles.panelTitle}>Search &amp; schema</h2>
                    <p className={styles.panelSub}>What search engines index for this page, and which rich-result schema the storefront emits.</p>
                </div>
            </header>
            <div className={styles.seoGrid}>
                <form className={styles.form} onSubmit={submit} noValidate>
                    <Field label="Page title" help="Internal name, also used as the H1 fallback." error={show("title")} required>
                        {(id, d) => <Input id={id} value={draft.title} maxLength={SEO_LIMITS.pageTitle.max} onChange={(e) => set("title", e.target.value)} aria-describedby={d} aria-invalid={Boolean(show("title"))} aria-required="true" disabled={!canEdit} />}
                    </Field>
                    <Field label="SEO title" error={show("seoTitle")} required>
                        {(id, d) => (
                            <>
                                <Input id={id} value={draft.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} aria-describedby={describe(d, `${id}-count`)} aria-invalid={Boolean(show("seoTitle"))} aria-required="true" disabled={!canEdit} />
                                <LengthCounter id={`${id}-count`} length={draft.seoTitle.trim().length} min={SEO_LIMITS.seoTitle.min} max={SEO_LIMITS.seoTitle.max} />
                            </>
                        )}
                    </Field>
                    <Field label="SEO description" error={show("seoDescription")} required>
                        {(id, d) => (
                            <>
                                <Textarea id={id} rows={3} value={draft.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} aria-describedby={describe(d, `${id}-count`)} aria-invalid={Boolean(show("seoDescription"))} aria-required="true" disabled={!canEdit} />
                                <LengthCounter id={`${id}-count`} length={draft.seoDescription.trim().length} min={SEO_LIMITS.seoDescription.min} max={SEO_LIMITS.seoDescription.max} />
                            </>
                        )}
                    </Field>
                    <Field label="Canonical path" help="The one URL search engines should credit, e.g. /salon." error={show("canonicalPath")} required>
                        {(id, d) => <Input id={id} value={draft.canonicalPath} onChange={(e) => set("canonicalPath", e.target.value)} aria-describedby={d} aria-invalid={Boolean(show("canonicalPath"))} aria-required="true" disabled={!canEdit} />}
                    </Field>
                    <fieldset className={styles.fieldset}>
                        <legend className={styles.legend}>Structured data (JSON-LD)</legend>
                        <div className={styles.checkGrid}>
                            {SCHEMA_TOGGLES.map((t) => (
                                <Checkbox key={t.key} label={t.label} help={t.help} checked={draft.schemaToggles[t.key]} onChange={(v) => toggle(t.key, v)} disabled={!canEdit} />
                            ))}
                        </div>
                    </fieldset>
                    <Field label="Collection copy" help="Optional intro paragraph rendered above product grids — useful for long-tail keywords." error={show("collectionCopy")}>
                        {(id, d) => <Textarea id={id} rows={4} value={draft.collectionCopy} onChange={(e) => set("collectionCopy", e.target.value)} aria-describedby={d} disabled={!canEdit} />}
                    </Field>
                    <div className={styles.formActions}>
                        <Button type="submit" disabled={!canEdit || saving || !dirty || (touched && invalid)}>Save SEO settings</Button>
                        {dirty ? <span className={styles.dirty}>Unsaved changes</span> : null}
                    </div>
                </form>
                <div className={styles.seoAside}>
                    <SerpPreview title={draft.seoTitle} path={draft.canonicalPath} description={draft.seoDescription} />
                </div>
            </div>
        </section>
    );
}
