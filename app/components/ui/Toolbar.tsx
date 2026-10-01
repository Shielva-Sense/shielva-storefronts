"use client";

import { Search } from "lucide-react";
import type { ReactNode } from "react";
import { Field, Input } from "./Field";
import styles from "./Toolbar.module.scss";

export function Toolbar({ start, end, label = "Table controls" }: { start?: ReactNode; end?: ReactNode; label?: string }): React.JSX.Element {
    return (
        <div role="toolbar" aria-label={label} className={styles.toolbar}>
            <div className={styles.start}>{start}</div>
            <div className={styles.end}>{end}</div>
        </div>
    );
}

export function SearchInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }): React.JSX.Element {
    return (
        <div className={styles.search}>
            <Search size={14} aria-hidden="true" className={styles.icon} />
            <Field label={label} hideLabel>
                {(id) => <Input id={id} type="search" placeholder={label} value={value} onChange={(e) => onChange(e.target.value)} />}
            </Field>
        </div>
    );
}
