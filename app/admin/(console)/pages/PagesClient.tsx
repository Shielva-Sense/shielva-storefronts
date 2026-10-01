"use client";

import { useState } from "react";
import { ExternalLink, LayoutTemplate, Plus } from "lucide-react";
import { ListLayout } from "@/components/layouts/ListLayout";
import { Button, ButtonLink } from "@/components/ui/Button";
import { confirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { BrandSpinner } from "@/components/ui/ProgressOverlay";
import { StatSection, type Stat } from "@/components/ui/StatSection";
import { toast } from "@/components/ui/Toast";
import { useAdmin } from "@/features/admin-session/AdminContext";
import { AddSectionModal } from "@/features/admin-content/components/AddSectionModal";
import contentStyles from "@/features/admin-content/components/Content.module.scss";
import builderStyles from "@/features/admin-content/components/PageBuilder.module.scss";
import { ReadOnlyNotice } from "@/components/ui/ReadOnlyNotice";
import { SectionEditor } from "@/features/admin-content/components/SectionEditor";
import { SectionList } from "@/features/admin-content/components/SectionList";
import { SeoPanel } from "@/features/admin-content/components/SeoPanel";
import { HOME_PAGE_SLUG, scheduleState } from "@/features/admin-content/constants";
import { useAddSection, useDeleteSection, usePages, usePatchSection, useReorderSections, useSavePage, useSectionLibrary } from "@/features/admin-content/hooks";
import type { PageSection, SectionDef } from "@/features/admin-content/types";
import styles from "./Pages.module.scss";


function deriveStats(sections: readonly PageSection[]): Stat[] {
    const enabled = sections.filter((s) => s.enabled).length;
    const ab = sections.filter((s) => s.variantBProps !== null && s.abSplit > 0).length;
    const scheduled = sections.filter((s) => scheduleState(s.startsAt, s.endsAt) !== null).length;
    return [
        { label: "Sections", value: String(sections.length), hint: "Rendered top to bottom" },
        { label: "Visible", value: String(enabled), hint: `${sections.length - enabled} hidden`, tone: enabled > 0 ? "success" : "warning" },
        { label: "A/B tests", value: String(ab), hint: "Results on the Dashboard", tone: ab > 0 ? "info" : "neutral" },
        { label: "Scheduled", value: String(scheduled), hint: "Time-boxed sections" },
    ];
}

export function PagesClient(): React.JSX.Element {
    const { tenant, store, can } = useAdmin();
    const canEdit = can("admin");
    const pages = usePages(tenant);
    const library = useSectionLibrary(tenant);
    const savePage = useSavePage(tenant, HOME_PAGE_SLUG);
    const addSection = useAddSection(tenant, HOME_PAGE_SLUG);
    const patchSection = usePatchSection(tenant);
    const reorder = useReorderSections(tenant, HOME_PAGE_SLUG);
    const deleteSection = useDeleteSection(tenant);
    const [adding, setAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const page = pages.data?.find((p) => p.slug === HOME_PAGE_SLUG);
    const sections = page?.sections ?? [];
    const defs = library.data ?? [];
    const editing = sections.find((s) => s.id === editingId);

    const move = (index: number, delta: -1 | 1): void => {
        const ids = sections.map((s) => s.id);
        const target = index + delta;
        const a = ids[index];
        const b = ids[target];
        if (a === undefined || b === undefined) return;
        ids[index] = b;
        ids[target] = a;
        reorder.mutate(ids);
    };

    const remove = async (section: PageSection, label: string): Promise<void> => {
        const ok = await confirmDialog({
            title: `Delete "${label}"?`,
            description: "The section and any A/B variant or schedule on it are removed from the live storefront. This cannot be undone.",
            confirmLabel: "Delete section",
            danger: true,
        });
        if (ok) deleteSection.mutate(section.id);
    };

    const pick = (def: SectionDef): void => {
        setAdding(false);
        addSection.mutate(def);
    };

    const headerActions = (
        <>
            <ButtonLink href={`/${store.slug}`} variant="secondary" external>
                <span>Preview storefront</span>
                <ExternalLink size={14} aria-hidden="true" />
                <span className="visually-hidden">(opens in a new tab)</span>
            </ButtonLink>
            <Button leftIcon={<Plus size={14} aria-hidden="true" />} onClick={() => setAdding(true)} disabled={!canEdit || !page || defs.length === 0}>
                Add section
            </Button>
        </>
    );

    let body: React.ReactNode;
    if (pages.isPending) body = <BrandSpinner mode="content" message="Loading the page and its sections…" />;
    else if (pages.isError)
        body = (
            <div className={contentStyles.errorBox} role="alert">
                <p>Couldn&apos;t load the page builder: {pages.error.message}</p>
                <Button variant="secondary" onClick={() => void pages.refetch()}>Try again</Button>
            </div>
        );
    else if (!page)
        body = (
            <EmptyState
                icon={<LayoutTemplate size={32} aria-hidden="true" />}
                title="This storefront has no home page yet"
                description="The page builder edits the storefront home: an ordered stack of sections from the store's library, plus its SEO title, description and schema. Seed the store to create it."
            />
        );
    else
        body = (
            <>
                <SeoPanel key={page.id} page={page} canEdit={canEdit} saving={savePage.isPending} onSave={(input) => savePage.mutate(input)} />
                <section className={builderStyles.panel} aria-labelledby="sections-heading">
                    <header className={builderStyles.panelHead}>
                        <div>
                            <h2 id="sections-heading" className={builderStyles.panelTitle}>Sections</h2>
                            <p className={builderStyles.panelSub}>Top of the list renders first. Hidden sections stay configured but are skipped by the storefront.</p>
                        </div>
                    </header>
                    {library.isError ? <p className={styles.libraryError} role="alert">Section labels are unavailable ({library.error.message}); showing raw types.</p> : null}
                    {sections.length === 0 ? (
                        <EmptyState
                            icon={<LayoutTemplate size={32} aria-hidden="true" />}
                            title="No sections on this page"
                            description="Sections are the building blocks of the storefront home — hero, service menu, reviews, journal teaser. Add one from this store's library to start composing the page."
                            action={canEdit ? <Button leftIcon={<Plus size={14} aria-hidden="true" />} onClick={() => setAdding(true)}>Add the first section</Button> : undefined}
                        />
                    ) : (
                        <SectionList
                            sections={sections}
                            library={defs}
                            canEdit={canEdit}
                            onMove={move}
                            onToggle={(s, enabled) => patchSection.mutate({ id: s.id, patch: { enabled } })}
                            onEdit={(s) => setEditingId(s.id)}
                            onDelete={(s, label) => void remove(s, label)}
                        />
                    )}
                </section>
            </>
        );

    return (
        <ListLayout
            title="Page builder"
            subtitle="The storefront home renders exactly these sections, in this order. A/B-tested sections bucket each visitor server-side (sticky per visitor) — compare variants on the Dashboard."
            headerActions={headerActions}
            stats={<StatSection stats={deriveStats(sections)} show={Boolean(page)} />}
            aboveContent={canEdit ? undefined : <ReadOnlyNotice what="the page layout or SEO settings" />}
        >
            {body}
            <AddSectionModal open={adding} library={defs} onClose={() => setAdding(false)} onPick={pick} />
            {editing ? (
                <SectionEditor
                    key={editing.id}
                    section={editing}
                    def={defs.find((d) => d.type === editing.type)}
                    canEdit={canEdit}
                    onClose={() => setEditingId(null)}
                    onSave={(patch) => {
                        setEditingId(null);
                        patchSection.mutate({ id: editing.id, patch }, { onSuccess: () => toast.success("Section saved — the storefront is revalidating.") });
                    }}
                />
            ) : null}
        </ListLayout>
    );
}
