"use client";

import { useSyncExternalStore } from "react";
import { Button } from "./Button";
import { Modal } from "./Modal";

interface ConfirmOptions {
    title: string;
    description: string;
    confirmLabel?: string;
    danger?: boolean;
}
interface Pending extends ConfirmOptions {
    resolve: (ok: boolean) => void;
}

let pending: Pending | null = null;
const listeners = new Set<() => void>();
const emit = (): void => listeners.forEach((l) => l());

/** Imperative confirm — never window.confirm. Resolves true on confirm. */
export function confirmDialog(opts: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
        pending?.resolve(false);
        pending = { ...opts, resolve };
        emit();
    });
}

function close(ok: boolean): void {
    pending?.resolve(ok);
    pending = null;
    emit();
}

export function ConfirmHost(): React.JSX.Element | null {
    const current = useSyncExternalStore(
        (l) => {
            listeners.add(l);
            return () => listeners.delete(l);
        },
        () => pending,
        () => null,
    );
    if (!current) return null;
    return (
        <Modal
            open
            size="sm"
            role={current.danger ? "alertdialog" : "dialog"}
            onClose={() => close(false)}
            title={current.title}
            description={current.description}
            footer={
                <>
                    <Button variant="secondary" onClick={() => close(false)}>Cancel</Button>
                    <Button variant={current.danger ? "danger" : "primary"} onClick={() => close(true)}>{current.confirmLabel ?? "Confirm"}</Button>
                </>
            }
        />
    );
}
