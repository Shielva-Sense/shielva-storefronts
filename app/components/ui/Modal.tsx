"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import styles from "./Modal.module.scss";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
let lockCount = 0;

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children?: ReactNode;
    footer?: ReactNode;
    size?: "sm" | "md" | "lg";
    role?: "dialog" | "alertdialog";
}

/** Centered dialog: focus trap, Escape, focus restore, nested-safe scroll lock. */
export function Modal({ open, onClose, title, description, children, footer, size = "md", role = "dialog" }: ModalProps): React.JSX.Element | null {
    const titleId = useId();
    const descId = useId();
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const previous = document.activeElement as HTMLElement | null;
        lockCount += 1;
        document.body.classList.add("scroll-locked");
        panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
        const onKey = (e: KeyboardEvent): void => {
            if (e.key === "Escape") return onClose();
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
            <button type="button" className={styles.backdrop} aria-label="Close dialog" tabIndex={-1} onClick={onClose} />
            <div ref={panelRef} role={role} aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descId : undefined} className={styles.panel} data-size={size}>
                <header className={styles.header}>
                    <h2 id={titleId} className={styles.title}>{title}</h2>
                    <button type="button" className={styles.close} onClick={onClose} aria-label="Close"><X size={15} aria-hidden="true" /></button>
                </header>
                {description ? <p id={descId} className={styles.desc}>{description}</p> : null}
                {children ? <div className={styles.body}>{children}</div> : null}
                {footer ? <footer className={styles.footer}>{footer}</footer> : null}
            </div>
        </div>
    );
}
