"use client";

import { ShoppingBag } from "lucide-react";
import { useCart } from "@/core/cart/CartContext";
import styles from "./CartButton.module.scss";

export function CartButton(): React.JSX.Element {
    const { count, open } = useCart();
    return (
        <button type="button" className={styles.btn} onClick={open} aria-label={`Open bag, ${count} item${count === 1 ? "" : "s"}`}>
            <ShoppingBag size={15} aria-hidden="true" />
            <span className={styles.count} data-empty={count === 0}>{count}</span>
        </button>
    );
}
