"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { AddToBag } from "@/components/ui/AddToBag";
import { formatPrice } from "@/core/formatters";
import { useCatalog } from "@/features/storefront/CatalogContext";
import { skuForSize } from "../catalog";
import type { FashionProduct } from "../types";
import styles from "./LookHotspot.module.scss";

/** "Shop the look" pin: disclosure button → product card with quick add. */
export function LookHotspot({ product, x, y }: { product: FashionProduct; x: number; y: number }): React.JSX.Element {
    const [open, setOpen] = useState(false);
    const panelId = useId();
    const root = useRef<HTMLDivElement>(null);
    const sku = skuForSize(product, "M");
    const price = useCatalog().price(sku, product.price);

    useEffect(() => {
        if (!open) return;
        const onDown = (e: PointerEvent): void => {
            if (!root.current?.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent): void => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("pointerdown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("pointerdown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    return (
        <div ref={root} className={styles.spot} style={{ "--x": `${x}%`, "--y": `${y}%` } as React.CSSProperties} data-open={open}>
            <button type="button" className={styles.pin} aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((o) => !o)}>
                <Plus size={14} aria-hidden="true" />
                <span className="visually-hidden">Shop {product.name}</span>
            </button>
            {open ? (
                <div id={panelId} className={styles.card}>
                    <p className={styles.name}>{product.name}</p>
                    <p className={styles.meta}>{product.colourName} · {product.material}</p>
                    <p className={styles.price}>{formatPrice(price)}</p>
                    <AddToBag sku={sku} name={product.name} price={product.price} variant="Size M" label="Quick add M" size="sm" fullWidth />
                </div>
            ) : null}
        </div>
    );
}
