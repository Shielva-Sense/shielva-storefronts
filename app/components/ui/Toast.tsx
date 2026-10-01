"use client";

import { useSyncExternalStore } from "react";
import styles from "./Toast.module.scss";

type Tone = "success" | "error" | "info";
interface ToastItem { id: number; tone: Tone; message: string }

let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const EMPTY: ToastItem[] = [];

function emit(): void {
    listeners.forEach((l) => l());
}

function push(tone: Tone, message: string): void {
    const id = nextId++;
    items = [...items, { id, tone, message }];
    emit();
    window.setTimeout(() => {
        items = items.filter((t) => t.id !== id);
        emit();
    }, 4200);
}

export const toast = {
    success: (message: string): void => push("success", message),
    error: (message: string): void => push("error", message),
    info: (message: string): void => push("info", message),
};

function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function Toaster(): React.JSX.Element {
    const list = useSyncExternalStore(subscribe, () => items, () => EMPTY);
    const polite = list.filter((t) => t.tone !== "error");
    const urgent = list.filter((t) => t.tone === "error");
    return (
        <div className={styles.region}>
            <div role="status" aria-live="polite" className={styles.stack}>
                {polite.map((t) => (
                    <p key={t.id} className={styles.toast} data-tone={t.tone}>{t.message}</p>
                ))}
            </div>
            <div role="alert" aria-live="assertive" className={styles.stack}>
                {urgent.map((t) => (
                    <p key={t.id} className={styles.toast} data-tone={t.tone}>{t.message}</p>
                ))}
            </div>
        </div>
    );
}
