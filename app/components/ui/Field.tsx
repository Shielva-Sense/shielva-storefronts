"use client";

import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import styles from "./Field.module.scss";

interface FieldProps {
    label: string;
    help?: string | undefined;
    error?: string | undefined;
    required?: boolean;
    hideLabel?: boolean;
    children: (id: string, describedBy: string | undefined) => ReactNode;
}

export function Field({ label, help, error, required = false, hideLabel = false, children }: FieldProps): React.JSX.Element {
    const id = useId();
    const helpId = `${id}-help`;
    const errorId = `${id}-error`;
    const describedBy = [help ? helpId : "", error ? errorId : ""].filter(Boolean).join(" ") || undefined;
    return (
        <div className={styles.field}>
            <label htmlFor={id} className={hideLabel ? "visually-hidden" : styles.label}>
                {label}
                {required ? <span aria-hidden="true"> *</span> : null}
            </label>
            {children(id, describedBy)}
            {help ? <p id={helpId} className={styles.help}>{help}</p> : null}
            {error ? <p id={errorId} className={styles.error}>{error}</p> : null}
        </div>
    );
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>): React.JSX.Element {
    return <input className={[styles.control, className ?? ""].join(" ")} {...rest} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>): React.JSX.Element {
    return (
        <div className={styles.selectWrap}>
            <select className={[styles.control, styles.select, className ?? ""].join(" ")} {...rest}>
                {children}
            </select>
            <ChevronDown size={14} aria-hidden="true" className={styles.chevron} />
        </div>
    );
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>): React.JSX.Element {
    return <textarea className={[styles.control, styles.textarea, className ?? ""].join(" ")} {...rest} />;
}

/** Labelled checkbox — owns its own id/label association. */
export function Checkbox({ label, checked, onChange, disabled, help }: { label: string; checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean; help?: string }): React.JSX.Element {
    const id = useId();
    return (
        <div className={styles.checkRow}>
            <input id={id} type="checkbox" className={styles.checkbox} checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} aria-describedby={help ? `${id}-help` : undefined} />
            <label htmlFor={id}>{label}</label>
            {help ? <p id={`${id}-help`} className={styles.help}>{help}</p> : null}
        </div>
    );
}
