import Link from "next/link";
import type { ReactNode } from "react";
import { Marquee } from "@/components/motion/Marquee";
import { ExperimentBeacon } from "@/features/storefront/Beacons";
import { EDIT_ATTR, editAttrs, listItemAttrs, type EditAttrs } from "@/features/inline-edit/markers";
import type { PostSummary, ResolvedSection, StoreSlug } from "@/features/storefront/types";
import styles from "./SharedSections.module.scss";

/** Wraps a section; when it is in an A/B test, reports the exposure. */
export function SectionFrame({ store, section, children }: { store: StoreSlug; section: ResolvedSection; children: ReactNode }): React.JSX.Element {
    return (
        <>
            {section.variant ? <ExperimentBeacon store={store} sectionId={section.id} variant={section.variant} /> : null}
            {children}
        </>
    );
}

export const prop = (section: ResolvedSection, key: string, fallback: string): string => {
    const v = section.props[key];
    return v && v.trim() ? v : fallback;
};

/** A section text prop, rendered with inline-edit markers when an admin is viewing. */
export function EditableText({ section, field, fallback }: { section: ResolvedSection; field: string; fallback: string }): React.JSX.Element {
    const value = prop(section, field, fallback);
    const attrs = editAttrs(section, field, value);
    return attrs[EDIT_ATTR] ? <span {...attrs}>{value}</span> : <>{value}</>;
}

/** Fill "{price}"-style tokens in section copy with live values (unknown tokens stay visible). */
export function fillTemplate(template: string, values: Readonly<Record<string, string>>): string {
    return template.replace(/\{(\w+)\}/g, (token, key: string) => values[key] ?? token);
}

/** Section copy containing live values. Visitors see the filled text; editors edit the template. */
export function templateProp(section: ResolvedSection, field: string, fallback: string, values: Readonly<Record<string, string>>): { text: string; edit: EditAttrs } {
    const template = prop(section, field, fallback);
    return { text: fillTemplate(template, values), edit: editAttrs(section, field, template) };
}

export function EditableTemplate({ section, field, fallback, values }: { section: ResolvedSection; field: string; fallback: string; values: Readonly<Record<string, string>> }): React.JSX.Element {
    const { text, edit } = templateProp(section, field, fallback, values);
    return edit[EDIT_ATTR] ? <span {...edit}>{text}</span> : <>{text}</>;
}

/** A numeric section prop (edited as plain digits); unparsable → the fallback. */
export function numberProp(section: ResolvedSection, key: string, fallback: number): number {
    const n = Number.parseFloat((section.props[key] ?? "").replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/** A number shown formatted (e.g. "$125") whose editor value is the plain number. */
export function EditableNumber({ section, field, fallback, format }: { section: ResolvedSection; field: string; fallback: number; format: (n: number) => string }): React.JSX.Element {
    const n = numberProp(section, field, fallback);
    const attrs = editAttrs(section, field, String(n));
    return attrs[EDIT_ATTR] ? <span {...attrs}>{format(n)}</span> : <>{format(n)}</>;
}

export const listProp = (section: ResolvedSection, key: string, fallback: readonly string[]): string[] => {
    const v = section.props[key];
    const items = v ? v.split("|").map((s) => s.trim()).filter(Boolean) : [];
    return items.length > 0 ? items : [...fallback];
};

export function AnnouncementSection({ text, edit }: { text: string; edit?: EditAttrs }): React.JSX.Element {
    return (
        <aside className={styles.announcement} role="note">
            <p {...edit}>{text}</p>
        </aside>
    );
}

/** Ticker of a section's "|"-separated `items` prop (each item editable in place). */
export function MarqueeSection({ section, fallback, label }: { section: ResolvedSection; fallback: readonly string[]; label: string }): React.JSX.Element {
    const items = listProp(section, "items", fallback);
    return <Marquee items={items} label={label} itemEdits={items.map((_, i) => listItemAttrs(section, "items", items, i))} />;
}

export function JournalTeaser({ store, title, posts, edit, more = "All stories", moreEdit }: { store: StoreSlug; title: string; posts: readonly PostSummary[]; edit?: EditAttrs; more?: string; moreEdit?: EditAttrs }): React.JSX.Element | null {
    if (posts.length === 0) return null;
    return (
        <section className={`section ${styles.journal}`} aria-labelledby={`${store}-journal-title`}>
            <div className="container stack">
                <div className="row row-between row-wrap">
                    <h2 id={`${store}-journal-title`} className={`display ${styles.journalTitle}`} {...edit}>{title}</h2>
                    <Link href={`/${store}/journal`} className={styles.more}><span {...moreEdit}>{more}</span></Link>
                </div>
                <ul className={styles.posts}>
                    {posts.slice(0, 3).map((p, i) => (
                        <li key={p.slug} data-reveal="rise" style={{ "--i": i } as React.CSSProperties}>
                            <Link href={`/${store}/journal/${p.slug}`} className={styles.post}>
                                <span className={styles.postTitle}>{p.title}</span>
                                <span className={styles.excerpt}>{p.excerpt}</span>
                                <span className={styles.meta}>{p.author}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}

/** Editable SEO body copy (collection copy) — real crawlable text, not hidden. */
export function CollectionCopy({ text, title }: { text: string; title: string }): React.JSX.Element | null {
    if (!text.trim()) return null;
    return (
        <section className={styles.copy} aria-label={title}>
            <div className="container">
                <p>{text}</p>
            </div>
        </section>
    );
}
