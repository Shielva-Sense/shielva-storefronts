"use client";

import { useState, type FormEvent } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { contrastRatio, HEX_RE, RADIUS_OPTIONS, THEME_COLOR_KEYS, THEME_LABELS, WCAG_AA } from "../constants";
import type { ThemeKey, ThemeTokens } from "../types";
import buttonStyles from "@/components/ui/Button.module.scss";
import builder from "./PageBuilder.module.scss";
import styles from "./ThemeEditor.module.scss";

type Values = Record<ThemeKey, string>;

const PREVIEW_BUTTON = [buttonStyles.btn, buttonStyles.primary, buttonStyles.md].join(" ");

interface ThemeEditorProps {
    /** Saved overrides (empty = brand defaults). */
    tokens: ThemeTokens;
    /** The store's brand defaults, resolved from its theme class. */
    defaults: Values;
    /** Theme key → storefront CSS custom property. */
    cssVars: Record<ThemeKey, string>;
    warnings: readonly string[];
    canEdit: boolean;
    saving: boolean;
    onSave: (tokens: ThemeTokens) => void;
    onReset: () => void;
}

const CONTRAST_PAIRS: readonly { fg: ThemeKey; bg: ThemeKey; label: string }[] = [
    { fg: "text", bg: "background", label: "Text on background" },
    { fg: "textMuted", bg: "background", label: "Muted text on background" },
    { fg: "text", bg: "surface", label: "Text on surface" },
    { fg: "textMuted", bg: "surface", label: "Muted text on surface" },
];

/** Only values that differ from the brand default are stored as overrides. */
function overrides(values: Values, defaults: Values): ThemeTokens {
    const out: ThemeTokens = {};
    for (const [k, v] of Object.entries(values) as [ThemeKey, string][]) {
        const normal = k === "radius" ? v : v.toLowerCase();
        if (normal && normal !== defaults[k]) out[k] = normal;
    }
    return out;
}

/** Theme token form + live preview. Mount with a key derived from the saved tokens. */
export function ThemeEditor({ tokens, defaults, cssVars, warnings, canEdit, saving, onSave, onReset }: ThemeEditorProps): React.JSX.Element {
    const initial: Values = { ...defaults, ...tokens };
    const [values, setValues] = useState<Values>(initial);
    const set = (k: ThemeKey, v: string): void => setValues((prev) => ({ ...prev, [k]: v }));

    const invalid = THEME_COLOR_KEYS.filter((k) => !HEX_RE.test(values[k]));
    const dirty = JSON.stringify(overrides(values, defaults)) !== JSON.stringify(overrides(initial, defaults));
    const valid = (k: ThemeKey): string => (HEX_RE.test(values[k]) ? values[k] : defaults[k]);

    const previewStyle = Object.fromEntries((Object.keys(cssVars) as ThemeKey[]).map((k) => [cssVars[k], k === "radius" ? values.radius : valid(k)])) as React.CSSProperties;

    const submit = (e: FormEvent<HTMLFormElement>): void => {
        e.preventDefault();
        if (invalid.length > 0 || !canEdit) return;
        onSave(overrides(values, defaults));
    };

    return (
        <div className={styles.layout}>
            <form className={builder.panel} onSubmit={submit} noValidate aria-labelledby="theme-form-heading">
                <header className={builder.panelHead}>
                    <div>
                        <h2 id="theme-form-heading" className={builder.panelTitle}>Tokens</h2>
                        <p className={builder.panelSub}>Overrides apply on top of the storefront&apos;s brand defaults. Values equal to the default are not stored.</p>
                    </div>
                </header>
                <div className={styles.colors}>
                    {THEME_COLOR_KEYS.map((k) => {
                        const meta = THEME_LABELS[k];
                        const bad = !HEX_RE.test(values[k]);
                        return (
                            <div key={k} className={styles.colorRow}>
                                <Field label={`${meta.label} colour picker`} hideLabel>
                                    {(id) => <Input id={id} type="color" className={styles.swatch} value={valid(k)} onChange={(e) => set(k, e.target.value)} disabled={!canEdit} />}
                                </Field>
                                <Field label={`${meta.label} (hex)`} help={values[k] === defaults[k] ? `${meta.help} Brand default.` : meta.help} error={bad ? "Use the #rrggbb format." : undefined}>
                                    {(id, d) => (
                                        <Input id={id} value={values[k]} maxLength={7} spellCheck={false} onChange={(e) => set(k, e.target.value.trim())} aria-describedby={d} aria-invalid={bad} disabled={!canEdit} />
                                    )}
                                </Field>
                            </div>
                        );
                    })}
                </div>
                <Field label={THEME_LABELS.radius.label} help={THEME_LABELS.radius.help}>
                    {(id, d) => (
                        <Select id={id} value={values.radius} onChange={(e) => set("radius", e.target.value)} aria-describedby={d} disabled={!canEdit}>
                            {RADIUS_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </Select>
                    )}
                </Field>
                <div className={builder.formActions}>
                    <Button type="submit" disabled={!canEdit || saving || !dirty || invalid.length > 0}>Save theme</Button>
                    <Button variant="ghost" leftIcon={<RotateCcw size={14} aria-hidden="true" />} onClick={onReset} disabled={!canEdit || saving || Object.keys(tokens).length === 0}>
                        Reset to brand defaults
                    </Button>
                    {dirty ? <span className={builder.dirty}>Unsaved changes</span> : null}
                </div>
            </form>

            <div className={styles.aside}>
                <section className={builder.panel} aria-labelledby="theme-preview-heading">
                    <h2 id="theme-preview-heading" className={builder.panelTitle}>Live preview</h2>
                    <div className={styles.preview} style={previewStyle}>
                        <div className={styles.previewCard}>
                            <p className={styles.previewEyebrow}>New this week</p>
                            <h3 className={styles.previewHeading}>Colour that knows you.</h3>
                            <p className={styles.previewBody}>Body copy uses the text token on the surface token — this is how product descriptions and journal posts will read.</p>
                            <p className={styles.previewMuted}>Muted text: captions, prices before discount, helper copy.</p>
                            <div className={styles.previewActions}>
                                <span className={PREVIEW_BUTTON}>Primary action</span>
                                <span className={styles.previewAccent}>Accent link</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className={builder.panel} aria-labelledby="theme-contrast-heading">
                    <h2 id="theme-contrast-heading" className={builder.panelTitle}>Contrast check</h2>
                    <ul className={styles.contrast}>
                        {CONTRAST_PAIRS.map((p) => {
                            const ratio = contrastRatio(valid(p.fg), valid(p.bg));
                            const pass = ratio !== null && ratio >= WCAG_AA;
                            return (
                                <li key={`${p.fg}-${p.bg}`}>
                                    <span>{p.label}</span>
                                    <StatusBadge tone={pass ? "success" : "danger"}>{ratio === null ? "n/a" : `${ratio}:1 ${pass ? "AA pass" : "fails AA"}`}</StatusBadge>
                                </li>
                            );
                        })}
                    </ul>
                    <p className={builder.panelSub}>WCAG AA needs 4.5:1 for body text. Checks update as you edit.</p>
                    {warnings.length > 0 ? (
                        <div className={styles.warnings} role="status">
                            <p className={styles.warningsTitle}>Saved theme warnings</p>
                            <ul>
                                {warnings.map((w) => (
                                    <li key={w}>{w}</li>
                                ))}
                            </ul>
                        </div>
                    ) : null}
                </section>
            </div>
        </div>
    );
}
