"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { useCart } from "@/core/cart/CartContext";
import { formatPrice } from "@/core/formatters";
import { useCatalog } from "@/features/storefront/CatalogContext";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { ProductPhoto } from "@/components/ui/ProductPhoto";
import { photoAttrs, priceAttrs, productTitleAttrs, type EditAttrs } from "@/features/inline-edit/markers";
import type { BundleItem } from "../types";
import styles from "./BundleBuilder.module.scss";

const DEFAULT_CTA: { text: string; edit: EditAttrs } = { text: "Add the set to bag", edit: {} };

export function BundleBuilder({ items, pick, price, editor = false, cta = DEFAULT_CTA }: { items: readonly BundleItem[]; pick: number; price: number; editor?: boolean; cta?: { text: string; edit: EditAttrs } }): React.JSX.Element {
    const [picked, setPicked] = useState<readonly string[]>([]);
    const { add } = useCart();
    const catalog = useCatalog();
    const bundlePrice = catalog.price("everyday-edit", price);
    const priceOf = (id: string, fallback: number): number => catalog.price(id, fallback);
    const chosen = items.filter((b) => picked.includes(b.id));
    const full = picked.length === pick;
    const retail = chosen.reduce((n, b) => n + priceOf(b.id, b.price), 0);
    const saving = full ? retail - bundlePrice : 0;

    const toggle = (id: string): void => {
        setPicked((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : prev.length < pick ? [...prev, id] : prev));
    };

    const addSet = (): void => {
        add({ sku: "everyday-edit", name: "The Everyday Edit", price: bundlePrice, variant: chosen.map((c) => c.name).join(" + "), components: chosen.map((c) => c.id) });
        toast.success(`Set added — you saved ${formatPrice(saving)}`);
        setPicked([]);
    };

    return (
        <div className={styles.builder}>
            <ul className={styles.grid}>
                {items.map((item) => {
                    const on = picked.includes(item.id);
                    const locked = !on && full;
                    return (
                        <li key={item.id}>
                            <button
                                type="button"
                                className={styles.item}
                                aria-pressed={on}
                                disabled={locked}
                                onClick={() => toggle(item.id)}
                                style={{ "--tint": item.tint } as React.CSSProperties}
                            >
                                <span className={styles.dot} aria-hidden="true" {...photoAttrs(editor, item.handle)}>
                                    <ProductPhoto src={item.image} alt="" sizes="38px" fallback={null} />
                                    {on ? <Check size={14} className={styles.check} /> : null}
                                </span>
                                <span className={styles.itemName} {...productTitleAttrs(editor, item.handle, item.name)}>{item.name}</span>
                                <span className={styles.itemPrice} {...priceAttrs(editor, item.id, priceOf(item.id, item.price))}>{formatPrice(priceOf(item.id, item.price))}</span>
                            </button>
                        </li>
                    );
                })}
            </ul>
            <div className={styles.summary}>
                <div className={styles.slots} aria-hidden="true">
                    {Array.from({ length: pick }, (_, i) => (
                        <span key={`slot-${i}`} className={styles.slot} data-filled={i < picked.length} />
                    ))}
                </div>
                <p className={styles.status} aria-live="polite">
                    {full ? (
                        <>
                            <s>{formatPrice(retail)}</s> <strong>{formatPrice(bundlePrice)}</strong> — you save {formatPrice(saving)}
                        </>
                    ) : (
                        `Pick ${pick - picked.length} more to unlock ${formatPrice(bundlePrice)} set pricing`
                    )}
                </p>
                <Button variant="accent" size="lg" disabled={!full} onClick={addSet}><span {...cta.edit}>{cta.text}</span></Button>
            </div>
        </div>
    );
}
