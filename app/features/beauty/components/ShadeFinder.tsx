"use client";

import { useMemo, useState } from "react";
import { AddToBag } from "@/components/ui/AddToBag";
import { ChoiceGroup, type ChoiceOption } from "@/components/ui/ChoiceGroup";
import { ProductPhoto } from "@/components/ui/ProductPhoto";
import { formatPrice } from "@/core/formatters";
import { useCatalog } from "@/features/storefront/CatalogContext";
import { attributeAttrs, optionAttrs, photoAttrs, priceAttrs } from "@/features/inline-edit/markers";
import { matchShades, SKIN_TONE_META, UNDERTONE_HINT } from "../constants";
import { SKIN_TONES, UNDERTONES, type LipShade, type SkinTone, type Undertone } from "../types";
import styles from "./ShadeFinder.module.scss";

const TONE_OPTIONS: readonly ChoiceOption<SkinTone>[] = SKIN_TONES.map((t) => ({ value: t, label: SKIN_TONE_META[t].label }));
const UNDERTONE_OPTIONS: readonly ChoiceOption<Undertone>[] = UNDERTONES.map((u) => ({ value: u, label: u[0]?.toUpperCase() + u.slice(1) }));
const MATCH_LABELS = ["Best match", "Also loves you", "Bold pick"] as const;

export function ShadeFinder({ shades, editor = false }: { shades: readonly LipShade[]; editor?: boolean }): React.JSX.Element {
    const [tone, setTone] = useState<SkinTone>("medium");
    const [undertone, setUndertone] = useState<Undertone>("warm");
    const matches = useMemo(() => matchShades(shades, tone, undertone), [shades, tone, undertone]);
    const catalog = useCatalog();

    return (
        <div className={styles.finder} style={{ "--skin": `var(${SKIN_TONE_META[tone].cssVar})` } as React.CSSProperties}>
            <div className={styles.controls}>
                <ChoiceGroup
                    label="1 · Your skin depth"
                    variant="swatch"
                    options={TONE_OPTIONS}
                    value={tone}
                    onChange={setTone}
                    renderOption={(opt) => (
                        <span className={styles.tone} style={{ "--tone": `var(${SKIN_TONE_META[opt.value].cssVar})` } as React.CSSProperties} />
                    )}
                />
                <p className={styles.toneName} aria-live="polite">{SKIN_TONE_META[tone].label}</p>
                <ChoiceGroup label="2 · Your undertone" options={UNDERTONE_OPTIONS} value={undertone} onChange={setUndertone} />
                <p className={styles.hint}>{UNDERTONE_HINT[undertone]}</p>
            </div>

            <ul className={styles.results} aria-live="polite" aria-label="Your matched shades">
                {matches.map((shade, i) => (
                    <li key={`${tone}-${undertone}-${shade.id}`} className={styles.card} style={{ "--swatch": shade.swatch, "--i": i } as React.CSSProperties}>
                        <span className={styles.badge}>{MATCH_LABELS[i]}</span>
                        <span className={styles.blob} aria-hidden="true" {...photoAttrs(editor, shade.handle)}>
                            <ProductPhoto src={shade.image} alt="" sizes="200px" fallback={<span className={styles.lips} />} />
                            {shade.image ? <span className={styles.swatchChip} /> : null}
                        </span>
                        <h3 className={styles.name} {...optionAttrs(editor && Boolean(shade.handle), shade.sku, shade.name)}>{shade.name}</h3>
                        <p className={styles.meta}><span {...attributeAttrs(editor && Boolean(shade.handle), shade.sku, "finish", shade.finish)}>{shade.finish}</span> · <span {...priceAttrs(editor, shade.sku, catalog.price(shade.sku, shade.price))}>{formatPrice(catalog.price(shade.sku, shade.price))}</span></p>
                        <AddToBag sku={shade.sku} name={shade.productName} variant={shade.name} price={shade.price} size="sm" label="Add" />
                    </li>
                ))}
            </ul>
        </div>
    );
}
