"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { AddToBag } from "@/components/ui/AddToBag";
import { ChoiceGroup, type ChoiceOption } from "@/components/ui/ChoiceGroup";
import { Field, Select } from "@/components/ui/Field";
import { formatPrice } from "@/core/formatters";
import { useCatalog } from "@/features/storefront/CatalogContext";
import { skuForSize } from "../catalog";
import { BUILD_LABEL, FIT_LABEL, HEIGHT_OPTIONS, recommendSize, type HeightBand } from "../constants";
import { BUILDS, FITS, SIZES, type Build, type FashionProduct, type FitPreference } from "../types";
import styles from "./FitFinder.module.scss";

const BUILD_OPTIONS: readonly ChoiceOption<Build>[] = BUILDS.map((b) => ({ value: b, label: BUILD_LABEL[b] }));
const FIT_OPTIONS: readonly ChoiceOption<FitPreference>[] = FITS.map((f) => ({ value: f, label: FIT_LABEL[f] }));
const isHeight = (v: string): v is HeightBand => HEIGHT_OPTIONS.some((h) => h.value === v);

export function FitFinder({ products }: { products: readonly FashionProduct[] }): React.JSX.Element {
    const [height, setHeight] = useState<HeightBand>("170-180");
    const [build, setBuild] = useState<Build>("regular");
    const [fit, setFit] = useState<FitPreference>("true");
    const [productId, setProductId] = useState(products[0]?.id ?? "");
    const product = products.find((p) => p.id === productId) ?? products[0];
    const { size, confidence } = recommendSize(height, build, fit);
    const catalog = useCatalog();
    const sku = product ? skuForSize(product, size) : "";
    const price = product ? catalog.price(sku, product.price) : 0;

    return (
        <div className={styles.finder}>
            <div className={styles.inputs}>
                <Field label="Garment">
                    {(id) => (
                        <Select id={id} value={product?.id ?? ""} onChange={(e) => setProductId(e.target.value)}>
                            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </Select>
                    )}
                </Field>
                <Field label="Your height">
                    {(id) => (
                        <Select id={id} value={height} onChange={(e) => { if (isHeight(e.target.value)) setHeight(e.target.value); }}>
                            {HEIGHT_OPTIONS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
                        </Select>
                    )}
                </Field>
                <ChoiceGroup label="Build" variant="tile" options={BUILD_OPTIONS} value={build} onChange={setBuild} />
                <ChoiceGroup label="How you like it to fit" options={FIT_OPTIONS} value={fit} onChange={setFit} />
            </div>

            <div className={styles.result} aria-live="polite">
                <p className={styles.resultLabel}>Your size</p>
                <p key={size} className={styles.size}>{size}</p>
                <ol className={styles.scale} aria-hidden="true">
                    {SIZES.map((s) => <li key={s} data-on={s === size}>{s}</li>)}
                </ol>
                <p className={styles.confidence}>
                    <strong>{confidence}%</strong> of customers with your profile kept this size.
                </p>
                <p className={styles.guarantee}><ShieldCheck size={14} aria-hidden="true" /> Wrong fit? Free exchange within 30 days.</p>
                {product ? (
                    <AddToBag sku={sku} name={product.name} price={price} variant={`Size ${size}`} label={`Add size ${size} · ${formatPrice(price)}`} fullWidth size="lg" variantStyle="accent" />
                ) : null}
            </div>
        </div>
    );
}
