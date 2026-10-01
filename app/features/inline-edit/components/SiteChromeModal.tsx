"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { SITE_LABEL_KEYS, type SiteChrome, type SiteLabelKey, type SiteLink } from "@/features/storefront/site";
import { SITE_LIMITS } from "../constants";
import styles from "./SiteChromeModal.module.scss";

interface DraftLink extends SiteLink {
    id: string;
}
interface DraftColumn {
    id: string;
    title: string;
    links: DraftLink[];
}

const LABEL_NAMES: Record<SiteLabelKey, string> = { headerCta: "Header button", mobileCta: "Sticky mobile button", newsletterCta: "Newsletter button" };

const HREF_OK = (h: string): boolean => h === "" || (h.startsWith("/") && !h.startsWith("//")) || h.startsWith("#") || h.startsWith("https://");
const withId = (l: SiteLink): DraftLink => ({ ...l, id: crypto.randomUUID() });
const move = <T,>(list: T[], from: number, to: number): T[] => {
    if (to < 0 || to >= list.length) return list;
    const next = [...list];
    const [item] = next.splice(from, 1);
    if (item !== undefined) next.splice(to, 0, item);
    return next;
};

/** Structure of the header menu and footer: add, remove, reorder, change where links go. */
export function SiteChromeModal({ site, saving, onClose, onSave }: { site: SiteChrome; saving: boolean; onClose: () => void; onSave: (site: SiteChrome) => void }): React.JSX.Element {
    const [nav, setNav] = useState<DraftLink[]>(() => site.nav.map(withId));
    const [columns, setColumns] = useState<DraftColumn[]>(() => site.footer.columns.map((c) => ({ id: crypto.randomUUID(), title: c.title, links: c.links.map(withId) })));
    const [tagline, setTagline] = useState(site.footer.tagline);
    const [legal, setLegal] = useState(site.footer.legal);
    const [labels, setLabels] = useState(site.labels);
    // Only buttons this storefront actually shows (non-empty default) are offered.
    const labelKeys = SITE_LABEL_KEYS.filter((k) => site.labels[k] !== "");

    const allLinks = [...nav, ...columns.flatMap((c) => c.links)];
    const invalid = allLinks.some((l) => !l.label.trim() || !HREF_OK(l.href.trim())) || columns.some((c) => !c.title.trim()) || labelKeys.some((k) => !labels[k].trim());

    const setColumn = (id: string, fn: (c: DraftColumn) => DraftColumn): void => setColumns((cs) => cs.map((c) => (c.id === id ? fn(c) : c)));
    const strip = (l: DraftLink): SiteLink => ({ label: l.label.trim(), href: l.href.trim() });

    const save = (): void =>
        onSave({
            nav: nav.map(strip),
            footer: { tagline: tagline.trim(), legal: legal.trim(), columns: columns.map((c) => ({ title: c.title.trim(), links: c.links.map(strip) })) },
            labels,
        });

    return (
        <Modal
            open
            onClose={onClose}
            size="lg"
            title="Menu & footer"
            description="Links can point to a section on this page (#shades), a page (/beauty/journal) or another site (https://…). Leave the link empty for plain text."
            footer={
                <div className="row row-end">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={save} disabled={invalid || saving}>Save menu & footer</Button>
                </div>
            }
        >
            <div className={styles.body}>
                <section className={styles.group} aria-labelledby="menu-title">
                    <h3 id="menu-title" className={styles.heading}>Header menu</h3>
                    <LinkList links={nav} onChange={setNav} max={SITE_LIMITS.navLinks} addLabel="Add menu link" />
                </section>

                <section className={styles.group} aria-labelledby="footer-title">
                    <h3 id="footer-title" className={styles.heading}>Footer</h3>
                    <Field label="Tagline">{(id) => <Input id={id} value={tagline} maxLength={200} onChange={(e) => setTagline(e.target.value)} />}</Field>
                    {columns.map((col, i) => (
                        <fieldset key={col.id} className={styles.column}>
                            <legend className="visually-hidden">Footer column {i + 1}</legend>
                            <div className={styles.columnHead}>
                                <Field label={`Column ${i + 1} title`}>
                                    {(id) => <Input id={id} value={col.title} maxLength={60} onChange={(e) => setColumn(col.id, (c) => ({ ...c, title: e.target.value }))} />}
                                </Field>
                                <Button variant="ghost" size="sm" leftIcon={<Trash2 size={14} aria-hidden="true" />} onClick={() => setColumns((cs) => cs.filter((c) => c.id !== col.id))}>
                                    Remove column
                                </Button>
                            </div>
                            <LinkList links={col.links} onChange={(links) => setColumn(col.id, (c) => ({ ...c, links }))} max={SITE_LIMITS.columnLinks} addLabel="Add link" />
                        </fieldset>
                    ))}
                    {columns.length < SITE_LIMITS.columns ? (
                        <Button variant="secondary" size="sm" leftIcon={<Plus size={14} aria-hidden="true" />} onClick={() => setColumns((cs) => [...cs, { id: crypto.randomUUID(), title: "New column", links: [] }])}>
                            Add footer column
                        </Button>
                    ) : null}
                    <Field label="Legal line">{(id) => <Input id={id} value={legal} maxLength={200} onChange={(e) => setLegal(e.target.value)} />}</Field>
                </section>

                {labelKeys.length > 0 ? (
                    <section className={styles.group} aria-labelledby="labels-title">
                        <h3 id="labels-title" className={styles.heading}>Buttons</h3>
                        {labelKeys.map((key) => (
                            <Field key={key} label={LABEL_NAMES[key]}>
                                {(id) => <Input id={id} value={labels[key]} maxLength={40} onChange={(e) => setLabels((l) => ({ ...l, [key]: e.target.value }))} />}
                            </Field>
                        ))}
                    </section>
                ) : null}
            </div>
        </Modal>
    );
}

function LinkList({ links, onChange, max, addLabel }: { links: DraftLink[]; onChange: (links: DraftLink[]) => void; max: number; addLabel: string }): React.JSX.Element {
    const update = (id: string, patch: Partial<SiteLink>): void => onChange(links.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    return (
        <div className={styles.links}>
            {links.map((link, i) => {
                const badHref = !HREF_OK(link.href.trim());
                return (
                    <div key={link.id} className={styles.linkRow}>
                        <Field label="Label" error={link.label.trim() ? undefined : "Required"}>
                            {(id, describedBy) => <Input id={id} value={link.label} maxLength={60} aria-describedby={describedBy} aria-invalid={!link.label.trim()} onChange={(e) => update(link.id, { label: e.target.value })} />}
                        </Field>
                        <Field label="Link" error={badHref ? "Start with /, # or https://" : undefined}>
                            {(id, describedBy) => <Input id={id} value={link.href} maxLength={300} placeholder="#section, /page or https://…" aria-describedby={describedBy} aria-invalid={badHref} onChange={(e) => update(link.id, { href: e.target.value })} />}
                        </Field>
                        <div className={styles.rowActions}>
                            <Button variant="ghost" size="sm" aria-label={`Move ${link.label || "link"} up`} disabled={i === 0} onClick={() => onChange(move(links, i, i - 1))}><ArrowUp size={14} aria-hidden="true" /></Button>
                            <Button variant="ghost" size="sm" aria-label={`Move ${link.label || "link"} down`} disabled={i === links.length - 1} onClick={() => onChange(move(links, i, i + 1))}><ArrowDown size={14} aria-hidden="true" /></Button>
                            <Button variant="ghost" size="sm" aria-label={`Remove ${link.label || "link"}`} onClick={() => onChange(links.filter((l) => l.id !== link.id))}><Trash2 size={14} aria-hidden="true" /></Button>
                        </div>
                    </div>
                );
            })}
            {links.length < max ? (
                <Button variant="secondary" size="sm" leftIcon={<Plus size={14} aria-hidden="true" />} onClick={() => onChange([...links, { id: crypto.randomUUID(), label: "New link", href: "" }])}>
                    {addLabel}
                </Button>
            ) : null}
        </div>
    );
}
