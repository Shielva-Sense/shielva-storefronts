"use client";

import { Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "@/core/cart/CartContext";
import { formatPrice } from "@/core/formatters";
import { Button } from "./Button";
import { Drawer } from "./Drawer";
import { ProgressOverlay } from "./ProgressOverlay";
import styles from "./CartDrawer.module.scss";

interface CartDrawerProps {
    freeShippingAt: number;
    /** Optional AOV nudge rendered under the lines (bundle offer, add-on, membership). */
    upsell?: React.ReactNode;
}

export function CartDrawer({ freeShippingAt, upsell }: CartDrawerProps): React.JSX.Element {
    const { lines, subtotal, isOpen, close, setQty, checkout, checkingOut } = useCart();
    const remaining = Math.max(0, freeShippingAt - subtotal);
    const progress = Math.min(1, subtotal / freeShippingAt);

    return (
        <Drawer
            open={isOpen}
            onClose={close}
            title="Your bag"
            footer={
                lines.length > 0 ? (
                    <div className={styles.summary}>
                        <p className={styles.totalRow}>
                            <span>Subtotal</span>
                            <strong>{formatPrice(subtotal)}</strong>
                        </p>
                        <Button fullWidth size="lg" onClick={checkout} disabled={checkingOut}>Checkout securely</Button>
                        <p className={styles.secure}>You&apos;ll pay on Shopify&apos;s secure checkout — cards, Apple Pay, Google Pay and Shop Pay.</p>
                    </div>
                ) : undefined
            }
        >
            <div className={styles.shipping}>
                <p>{remaining > 0 ? `You're ${formatPrice(remaining)} away from free shipping` : "Free shipping unlocked"}</p>
                <div className={styles.bar} aria-hidden="true">
                    <div className={styles.fill} style={{ "--fill": progress } as React.CSSProperties} />
                </div>
            </div>

            {lines.length === 0 ? (
                <div className={styles.empty}>
                    <ShoppingBag size={32} aria-hidden="true" />
                    <p>Your bag is empty — add something you love.</p>
                </div>
            ) : (
                <ul className={styles.lines}>
                    {lines.map((line) => (
                        <li key={line.id} className={styles.line}>
                            <div>
                                <p className={styles.name}>{line.name}</p>
                                {line.variant ? <p className={styles.variant}>{line.variant}</p> : null}
                                <p className={styles.price}>{formatPrice(line.price * line.qty)}</p>
                            </div>
                            <div className={styles.qty} role="group" aria-label={`Quantity for ${line.name}`}>
                                <button type="button" onClick={() => setQty(line.id, line.qty - 1)} aria-label="Decrease quantity">
                                    <Minus size={14} aria-hidden="true" />
                                </button>
                                <span aria-live="polite">{line.qty}</span>
                                <button type="button" onClick={() => setQty(line.id, line.qty + 1)} aria-label="Increase quantity">
                                    <Plus size={14} aria-hidden="true" />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
            {upsell}
            <ProgressOverlay open={checkingOut} message="Opening secure checkout…" detail="Handing your bag to Shopify Payments" />
        </Drawer>
    );
}
