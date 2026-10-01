"use client";

import { useRef, type KeyboardEvent } from "react";
import styles from "./TabNav.module.scss";

export interface TabItem<T extends string> { id: T; label: string; count?: number }

interface TabNavProps<T extends string> {
    label: string;
    idPrefix: string;
    tabs: readonly TabItem<T>[];
    active: T;
    onChange: (id: T) => void;
}

/** WAI-ARIA tabs: Left/Right/Home/End move focus + activate; only the active tab is tabbable. */
export function TabNav<T extends string>({ label, idPrefix, tabs, active, onChange }: TabNavProps<T>): React.JSX.Element {
    const refs = useRef<(HTMLButtonElement | null)[]>([]);

    const go = (index: number): void => {
        const n = tabs.length;
        const i = (index + n) % n;
        const tab = tabs[i];
        if (!tab) return;
        onChange(tab.id);
        refs.current[i]?.focus();
    };

    const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number): void => {
        const map: Record<string, number> = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
        const next = map[e.key];
        if (next === undefined) return;
        e.preventDefault();
        go(next);
    };

    return (
        <div role="tablist" aria-label={label} className={styles.tabs}>
            {tabs.map((tab, i) => {
                const selected = tab.id === active;
                return (
                    <button
                        key={tab.id}
                        ref={(el) => { refs.current[i] = el; }}
                        id={`${idPrefix}-tab-${tab.id}`}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        aria-controls={`${idPrefix}-panel`}
                        tabIndex={selected ? 0 : -1}
                        className={styles.tab}
                        onClick={() => onChange(tab.id)}
                        onKeyDown={(e) => onKeyDown(e, i)}
                    >
                        {tab.label}
                        {tab.count !== undefined ? <span className={styles.count}>{tab.count}</span> : null}
                    </button>
                );
            })}
        </div>
    );
}
