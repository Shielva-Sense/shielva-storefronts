"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { BrandSpinner } from "@/components/ui/ProgressOverlay";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { usePages, useSectionLibrary } from "@/features/admin-content/hooks";
import type { PageSection } from "@/features/admin-content/types";
import type { SectionLayout } from "../api";
import styles from "./SiteChromeModal.module.scss";

const HOME = "home";

/** Show / hide and reorder the storefront home page's sections. */
export function SectionsModal({ store, saving, onClose, onSave }: { store: string; saving: boolean; onClose: () => void; onSave: (layout: SectionLayout) => void }): React.JSX.Element {
    const pages = usePages(store);
    const library = useSectionLibrary(store);
    const home = pages.data?.find((p) => p.slug === HOME);

    return (
        <Modal open onClose={onClose} size="md" title="Sections" description="Turn sections on or off and change their order on this page.">
            {home && library.data ? (
                <SectionList sections={home.sections} labels={new Map(library.data.map((d) => [d.type, d.label]))} saving={saving} onCancel={onClose} onSave={(order, enabled) => onSave({ pageSlug: HOME, order, enabled })} />
            ) : pages.isError || library.isError ? (
                <p className="text-danger">Couldn&apos;t load the page&apos;s sections. Close and try again.</p>
            ) : (
                <BrandSpinner mode="content" message="Loading the page's sections…" />
            )}
        </Modal>
    );
}

function SectionList({ sections, labels, saving, onCancel, onSave }: { sections: PageSection[]; labels: Map<string, string>; saving: boolean; onCancel: () => void; onSave: (order: string[], enabled: Record<string, boolean>) => void }): React.JSX.Element {
    const [list, setList] = useState(() => [...sections].sort((a, b) => a.position - b.position));
    const original = new Map(sections.map((s) => [s.id, s.enabled]));
    const move = (from: number, to: number): void =>
        setList((l) => {
            if (to < 0 || to >= l.length) return l;
            const next = [...l];
            const [item] = next.splice(from, 1);
            if (item) next.splice(to, 0, item);
            return next;
        });

    const save = (): void => onSave(list.map((s) => s.id), Object.fromEntries(list.filter((s) => original.get(s.id) !== s.enabled).map((s) => [s.id, s.enabled])));

    return (
        <div className={styles.body}>
            <ol className={styles.sectionList}>
                {list.map((s, i) => {
                    const name = labels.get(s.type) ?? s.type;
                    return (
                        <li key={s.id} className={styles.sectionRow}>
                            <Checkbox label={name} checked={s.enabled} onChange={(on) => setList((l) => l.map((x) => (x.id === s.id ? { ...x, enabled: on } : x)))} />
                            <div className={styles.rowActions}>
                                <Button variant="ghost" size="sm" aria-label={`Move ${name} up`} disabled={i === 0} onClick={() => move(i, i - 1)}><ArrowUp size={14} aria-hidden="true" /></Button>
                                <Button variant="ghost" size="sm" aria-label={`Move ${name} down`} disabled={i === list.length - 1} onClick={() => move(i, i + 1)}><ArrowDown size={14} aria-hidden="true" /></Button>
                            </div>
                        </li>
                    );
                })}
            </ol>
            <div className="row row-end">
                <Button variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button onClick={save} disabled={saving}>Save sections</Button>
            </div>
        </div>
    );
}
