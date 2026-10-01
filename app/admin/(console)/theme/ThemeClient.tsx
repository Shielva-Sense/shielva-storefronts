"use client";

import { useCallback, useState } from "react";
import { ListLayout } from "@/components/layouts/ListLayout";
import { Button } from "@/components/ui/Button";
import { confirmDialog } from "@/components/ui/ConfirmDialog";
import { BrandSpinner } from "@/components/ui/ProgressOverlay";
import { StatSection, type Stat } from "@/components/ui/StatSection";
import { useAdmin } from "@/features/admin-session/AdminContext";
import contentStyles from "@/features/admin-content/components/Content.module.scss";
import { ReadOnlyNotice } from "@/components/ui/ReadOnlyNotice";
import { ThemeEditor } from "@/features/admin-content/components/ThemeEditor";
import { contrastRatio, DEFAULT_RADIUS, storeThemeClass, THEME_COLOR_KEYS, toHex, WCAG_AA } from "@/features/admin-content/constants";
import { useSaveTheme, useTheme } from "@/features/admin-content/hooks";
import type { ThemeKey, ThemeResponse } from "@/features/admin-content/types";
import styles from "./Theme.module.scss";

type Values = Record<ThemeKey, string>;

/** Reads the store's brand defaults from its theme class (styles/colors.scss) — the values "reset" returns to. */
function readDefaults(el: HTMLElement, keys: ThemeResponse["keys"]): Values {
    const css = getComputedStyle(el);
    const out = {} as Values;
    for (const k of Object.keys(keys) as ThemeKey[]) {
        const raw = css.getPropertyValue(keys[k]).trim();
        out[k] = k === "radius" ? raw || DEFAULT_RADIUS : toHex(raw);
    }
    return out;
}

function deriveStats(data: ThemeResponse, merged: Values): Stat[] {
    const overrides = Object.keys(data.tokens).length;
    const text = contrastRatio(merged.text, merged.background);
    return [
        { label: "Overrides", value: String(overrides), hint: overrides === 0 ? "Using brand defaults" : "Tokens changed from brand" },
        { label: "Text contrast", value: text === null ? "n/a" : `${text}:1`, hint: "Text on background (saved)", tone: text !== null && text >= WCAG_AA ? "success" : "danger" },
        { label: "Warnings", value: String(data.warnings.length), hint: "WCAG checks on the saved theme", tone: data.warnings.length > 0 ? "warning" : "success" },
        { label: "Colour tokens", value: String(THEME_COLOR_KEYS.length), hint: "Plus button radius" },
    ];
}

export function ThemeClient(): React.JSX.Element {
    const { tenant, store, can } = useAdmin();
    const canEdit = can("admin");
    const theme = useTheme(tenant);
    const save = useSaveTheme(tenant);
    const [defaults, setDefaults] = useState<{ store: string; values: Values } | null>(null);
    const keys = theme.data?.keys;

    const probe = useCallback(
        (el: HTMLDivElement | null) => {
            if (el && keys) setDefaults({ store: store.slug, values: readDefaults(el, keys) });
        },
        [keys, store.slug],
    );

    const reset = async (): Promise<void> => {
        const ok = await confirmDialog({
            title: "Reset to brand defaults?",
            description: "Every colour and radius override is removed and the storefront returns to its original brand theme.",
            confirmLabel: "Reset theme",
            danger: true,
        });
        if (ok) save.mutate({});
    };

    const ready = theme.data && defaults?.store === store.slug ? { data: theme.data, defaults: defaults.values } : null;

    let body: React.ReactNode;
    if (theme.isPending) body = <BrandSpinner mode="content" message="Loading theme tokens…" />;
    else if (theme.isError)
        body = (
            <div className={contentStyles.errorBox} role="alert">
                <p>Couldn&apos;t load the theme: {theme.error.message}</p>
                <Button variant="secondary" onClick={() => void theme.refetch()}>Try again</Button>
            </div>
        );
    else if (!ready) body = <BrandSpinner mode="content" message="Reading the brand defaults…" />;
    else
        body = (
            <ThemeEditor
                key={`${store.slug}:${JSON.stringify(ready.data.tokens)}`}
                tokens={ready.data.tokens}
                defaults={ready.defaults}
                cssVars={ready.data.keys}
                warnings={ready.data.warnings}
                canEdit={canEdit}
                saving={save.isPending}
                onSave={(tokens) => save.mutate(tokens)}
                onReset={() => void reset()}
            />
        );

    return (
        <ListLayout
            title="Theme"
            subtitle="Brand colour and radius tokens the storefront maps onto its CSS variables. Changes go live on the next storefront revalidation — check contrast before saving."
            stats={ready ? <StatSection stats={deriveStats(ready.data, { ...ready.defaults, ...ready.data.tokens })} /> : undefined}
            aboveContent={canEdit ? undefined : <ReadOnlyNotice what="the theme" />}
        >
            {keys ? <div ref={probe} key={store.slug} className={`${storeThemeClass(store.slug)} ${styles.probe}`} aria-hidden="true" /> : null}
            {body}
        </ListLayout>
    );
}
