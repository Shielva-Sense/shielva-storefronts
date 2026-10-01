"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import styles from "./Drawer.module.scss";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

let lockCount = 0;

interface DrawerProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    footer?: ReactNode;
}

/** Side sheet dialog: focus trap, Escape to close, focus restore, nested-safe scroll lock. */
export function Drawer({ open, onClose, title, children, footer }: DrawerProps): React.JSX.Element | null {
    const titleId = useId();
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const previous = document.activeElement as HTMLElement | null;
        lockCount += 1;
        document.body.classList.add("scroll-locked");
        panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

        const onKey = (e: KeyboardEvent): void => {
            if (e.key === "Escape") {
                onClose();
                return;
            }
            if (e.key !== "Tab" || !panelRef.current) return;
            const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
            const first = nodes[0];
            const last = nodes[nodes.length - 1];
            if (!first || !last) return;
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("keydown", onKey);
            lockCount -= 1;
            if (lockCount === 0) document.body.classList.remove("scroll-locked");
            previous?.focus();
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className={styles.root}>
            <button type="button" className={styles.backdrop} aria-label="Close panel" tabIndex={-1} onClick={onClose} />
            <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId} className={styles.panel}>
                <header className={styles.header}>
                    <h2 id={titleId} className={styles.title}>{title}</h2>
                    <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
                        <X size={15} aria-hidden="true" />
                    </button>
                </header>
                <div className={styles.body}>{children}</div>
                {footer ? <footer className={styles.footer}>{footer}</footer> : null}
            </div>
        </div>
    );
}
