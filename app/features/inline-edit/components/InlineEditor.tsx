"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LayoutList, ListTree, PencilLine, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { confirmDialog } from "@/components/ui/ConfirmDialog";
import { ProgressOverlay } from "@/components/ui/ProgressOverlay";
import { toast } from "@/components/ui/Toast";
import { useCatalogSchema } from "@/features/admin-catalog/hooks";
import { useAdminMe } from "@/features/admin-session/hooks";
import type { SiteChrome } from "@/features/storefront/site";
import type { StoreSlug } from "@/features/storefront/types";
import { parsePriceCents } from "../api";
import { EDITOR_ROLES, PHOTO_MAX_BYTES, PHOTO_SETTLE_MS, PHOTO_TYPES } from "../constants";
import type { SectionLayout } from "../api";
import { usePublishInlineChanges, useReplaceProductPhoto, useSaveSectionLayout, useSaveSiteChrome } from "../hooks";
import { EDIT_ATTR, EDIT_LIST_ATTR, EDIT_MEDIA_ATTR, EDIT_VALUE_ATTR, isPriceTarget, matchOption, parseEditTarget } from "../markers";
import type { InlineChange } from "../types";
import { SectionsModal } from "./SectionsModal";
import { SiteChromeModal } from "./SiteChromeModal";
import styles from "./InlineEditor.module.scss";

const EDITING_ATTR = "data-inline-editing";
const DIRTY_ATTR = "data-edit-dirty";
const INVALID_ATTR = "data-edit-invalid";
const ROLES: ReadonlySet<string> = new Set(EDITOR_ROLES);

const editables = (): HTMLElement[] => [...document.querySelectorAll<HTMLElement>(`[${EDIT_ATTR}]`)];
const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? "" : "s"}`;

/**
 * In-place editing of the live storefront for signed-in admins. The server marks editable
 * content (see `../markers.ts`): section copy, menu + footer, product names, prices and photos.
 * Text edits are collected and published together; a photo uploads straight to Shopify.
 */
export function InlineEditor({ store, site }: { store: StoreSlug; site: SiteChrome }): React.JSX.Element | null {
    const me = useAdminMe();
    const schema = useCatalogSchema(store);
    // Allowed values of a select-type variant attribute (null = free / validated by the API).
    const optionsFor = useRef<(key: string) => string[] | null>(() => null);
    useEffect(() => {
        optionsFor.current = (key) => {
            const def = schema.data?.variantAttributes.find((a) => a.key === key);
            return def?.type === "select" && def.options ? def.options : null;
        };
    }, [schema.data]);
    const publish = usePublishInlineChanges(store, site);
    const photo = useReplaceProductPhoto(store);
    const saveSite = useSaveSiteChrome(store);
    const saveSections = useSaveSectionLayout(store);
    const [editing, setEditing] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [sectionsOpen, setSectionsOpen] = useState(false);
    const [changes, setChanges] = useState<Map<string, InlineChange>>(() => new Map());
    const original = useRef(new Map<HTMLElement, string>());
    const fileInput = useRef<HTMLInputElement>(null);
    const photoHandle = useRef<string | null>(null);
    const leaving = useRef(false);

    const role = me.data?.stores.find((s) => s.slug === store)?.role;
    const canEdit = role !== undefined && ROLES.has(role);
    const invalid = [...changes.values()].some((c) => c.invalid === true || (isPriceTarget(c.target) && parsePriceCents(c.value) === null));

    useEffect(() => {
        if (!editing) return;
        const root = document.documentElement;
        root.setAttribute(EDITING_ATTR, "true");

        const onFocus = (e: FocusEvent): void => {
            const el = e.target as HTMLElement;
            if (!el.hasAttribute(EDIT_ATTR) || original.current.has(el)) return;
            // Swap decorative markup (split words, emphasis, "$") for the plain stored value.
            const value = el.getAttribute(EDIT_VALUE_ATTR) ?? el.textContent ?? "";
            original.current.set(el, value);
            el.textContent = value;
        };
        const onInput = (e: Event): void => {
            const el = e.target as HTMLElement;
            const key = el.getAttribute(EDIT_ATTR);
            const target = parseEditTarget(key);
            if (!key || !target) return;
            const value = (el.textContent ?? "").replace(/\s+/g, " ").trim();
            const dirty = value !== original.current.get(el);
            el.toggleAttribute(DIRTY_ATTR, dirty);
            const options = target.kind === "attribute" ? optionsFor.current(target.key) : null;
            const badOption = options !== null && matchOption(value, options) === null;
            el.toggleAttribute(INVALID_ATTR, (isPriceTarget(target) && parsePriceCents(value) === null) || badOption);
            setChanges((prev) => {
                const next = new Map(prev);
                const rawList = el.getAttribute(EDIT_LIST_ATTR);
                const list = rawList ? (JSON.parse(rawList) as string[]) : undefined;
                // Attributes are stored as the canonical option ("Satin", not "satin").
                const stored = options ? (matchOption(value, options) ?? value) : value;
                if (dirty && value) next.set(key, { key, target, value: stored, ...(list ? { list } : {}), ...(badOption ? { invalid: true } : {}) });
                else next.delete(key);
                return next;
            });
        };
        const onKey = (e: KeyboardEvent): void => {
            const el = e.target as HTMLElement;
            if (el.hasAttribute(EDIT_ATTR) && e.key === "Enter") {
                e.preventDefault();
                el.blur();
            }
        };
        const onClick = (e: MouseEvent): void => {
            const t = e.target as HTMLElement;
            if (t.closest(`.${styles.bar}`) || t.closest("[role=dialog]")) return;
            const media = t.closest<HTMLElement>(`[${EDIT_MEDIA_ATTR}]`);
            if (media && !t.closest(`[${EDIT_ATTR}]`)) {
                e.preventDefault();
                photoHandle.current = media.getAttribute(EDIT_MEDIA_ATTR);
                fileInput.current?.click();
                return;
            }
            // While editing, links and buttons on the page must not navigate or add to bag.
            if (t.closest(`[${EDIT_ATTR}]`) || t.closest("a, button")) e.preventDefault();
        };

        for (const el of editables()) {
            el.setAttribute("contenteditable", "plaintext-only");
            el.setAttribute("spellcheck", "true");
        }
        document.addEventListener("focusin", onFocus);
        document.addEventListener("input", onInput);
        document.addEventListener("keydown", onKey);
        document.addEventListener("click", onClick, true);
        return () => {
            root.removeAttribute(EDITING_ATTR);
            for (const el of editables()) el.removeAttribute("contenteditable");
            document.removeEventListener("focusin", onFocus);
            document.removeEventListener("input", onInput);
            document.removeEventListener("keydown", onKey);
            document.removeEventListener("click", onClick, true);
        };
    }, [editing]);

    // Leaving with unpublished text would silently drop it (the editor's own reloads are exempt).
    useEffect(() => {
        if (changes.size === 0) return;
        const warn = (e: BeforeUnloadEvent): void => {
            if (!leaving.current) e.preventDefault();
        };
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, [changes.size]);

    const reloadFresh = useCallback((delayMs = 0): void => {
        leaving.current = true;
        setChanges(new Map());
        // The editor rewrote server-rendered markup in place; reload to get the real page back.
        window.setTimeout(() => window.location.reload(), delayMs);
    }, []);

    const discard = async (): Promise<void> => {
        if (changes.size > 0 && !(await confirmDialog({ title: "Discard your changes?", description: `${plural(changes.size, "unpublished edit")} will be lost.`, confirmLabel: "Discard", danger: true }))) return;
        if (original.current.size > 0) reloadFresh();
        else setEditing(false);
    };

    const onPublish = (): void => {
        publish.mutate([...changes.values()], {
            onSuccess: (s) => {
                const parts = [s.sections ? plural(s.sections, "section") : "", s.site ? "menu & footer" : "", s.products ? plural(s.products, "product name") : "", s.prices ? plural(s.prices, "price") : "", s.names ? plural(s.names, "shade name") : ""].filter(Boolean);
                toast.success(`Published ${parts.join(", ")}.`);
                // Product edits round-trip through Shopify's webhook before the storefront shows them.
                reloadFresh(s.products || s.prices || s.names ? PHOTO_SETTLE_MS / 2 : 0);
            },
        });
    };

    const onPhotoPicked = (file: File | undefined): void => {
        const handle = photoHandle.current;
        if (fileInput.current) fileInput.current.value = "";
        if (!file || !handle) return;
        if (!(PHOTO_TYPES as readonly string[]).includes(file.type)) return toast.error("Use a JPEG, PNG or WebP image.");
        if (file.size > PHOTO_MAX_BYTES) return toast.error("That photo is over 10 MB — export a smaller version.");
        photo.mutate(
            { handle, file },
            {
                onSuccess: () => {
                    toast.success("Photo uploaded to Shopify — refreshing in a few seconds.");
                    reloadFresh(PHOTO_SETTLE_MS);
                },
            },
        );
    };

    const onSaveSite = (next: SiteChrome): void => {
        saveSite.mutate(next, {
            onSuccess: () => {
                toast.success("Menu & footer saved.");
                setMenuOpen(false);
                reloadFresh();
            },
        });
    };

    const onSaveSections = (layout: SectionLayout): void => {
        saveSections.mutate(layout, {
            onSuccess: () => {
                toast.success("Sections saved.");
                setSectionsOpen(false);
                reloadFresh();
            },
        });
    };

    if (!canEdit) return null;

    const busy = publish.isPending || photo.isPending || saveSite.isPending || saveSections.isPending;
    const lockedByText = changes.size > 0 ? "Publish or discard your text edits first" : undefined;
    return (
        <>
            <div className={styles.bar} role="region" aria-label="Page editor">
                {editing ? (
                    <>
                        <p className={styles.status} aria-live="polite">
                            {invalid ? "Fix the highlighted field (red)" : changes.size === 0 ? "Click any outlined text to edit it, a photo to replace it" : `${plural(changes.size, "unpublished change")}`}
                        </p>
                        <Button variant="ghost" size="sm" onClick={() => setSectionsOpen(true)} disabled={changes.size > 0} title={lockedByText} leftIcon={<LayoutList size={14} aria-hidden="true" />}>
                            Sections
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setMenuOpen(true)} disabled={changes.size > 0} title={lockedByText} leftIcon={<ListTree size={14} aria-hidden="true" />}>
                            Menu & footer
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => void discard()} leftIcon={<X size={14} aria-hidden="true" />}>
                            {changes.size > 0 ? "Discard" : "Done"}
                        </Button>
                        <Button size="sm" onClick={onPublish} disabled={changes.size === 0 || invalid || busy}>Publish</Button>
                    </>
                ) : (
                    <>
                        <Button size="sm" onClick={() => setEditing(true)} leftIcon={<PencilLine size={14} aria-hidden="true" />}>Edit page</Button>
                        <Link href="/admin" className={styles.link}>Admin</Link>
                    </>
                )}
            </div>
            <input ref={fileInput} type="file" accept={PHOTO_TYPES.join(",")} className="visually-hidden" tabIndex={-1} aria-label="Choose a product photo" onChange={(e) => onPhotoPicked(e.target.files?.[0])} />
            {sectionsOpen ? <SectionsModal store={store} saving={saveSections.isPending} onClose={() => setSectionsOpen(false)} onSave={onSaveSections} /> : null}
            {menuOpen ? <SiteChromeModal site={site} saving={saveSite.isPending} onClose={() => setMenuOpen(false)} onSave={onSaveSite} /> : null}
            <ProgressOverlay
                open={busy}
                message={photo.isPending ? "Uploading the photo to Shopify…" : saveSite.isPending ? "Saving the menu & footer…" : saveSections.isPending ? "Saving the sections…" : "Publishing your changes…"}
                detail={photo.isPending ? "Shopify hosts the image; the storefront picks it up automatically." : "Updating the live storefront."}
            />
        </>
    );
}
