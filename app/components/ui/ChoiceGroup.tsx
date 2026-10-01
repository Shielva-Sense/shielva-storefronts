"use client";

import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import styles from "./ChoiceGroup.module.scss";

export interface ChoiceOption<T extends string> {
    value: T;
    label: string;
    disabled?: boolean;
}

interface ChoiceGroupProps<T extends string> {
    label: string;
    hideLabel?: boolean;
    options: readonly ChoiceOption<T>[];
    value: T | null;
    onChange: (value: T) => void;
    /** Custom visual per option; defaults to the text label. */
    renderOption?: (option: ChoiceOption<T>, selected: boolean) => ReactNode;
    variant?: "pill" | "swatch" | "tile";
}

/** WAI-ARIA radiogroup: roving tabindex, arrows / Home / End move + select. */
export function ChoiceGroup<T extends string>({ label, hideLabel = false, options, value, onChange, renderOption, variant = "pill" }: ChoiceGroupProps<T>): React.JSX.Element {
    const labelId = useId();
    const refs = useRef<(HTMLButtonElement | null)[]>([]);
    const enabled = options.filter((o) => !o.disabled);
    const focusValue = value ?? enabled[0]?.value ?? null;

    const move = (from: number, step: number): void => {
        const n = options.length;
        for (let k = 1; k <= n; k++) {
            const idx = (from + step * k + n * n) % n;
            const opt = options[idx];
            if (opt && !opt.disabled) {
                onChange(opt.value);
                refs.current[idx]?.focus();
                return;
            }
        }
    };

    const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number): void => {
        const keys: Record<string, () => void> = {
            ArrowRight: () => move(index, 1),
            ArrowDown: () => move(index, 1),
            ArrowLeft: () => move(index, -1),
            ArrowUp: () => move(index, -1),
            Home: () => move(-1, 1),
            End: () => move(options.length, -1),
        };
        const handler = keys[e.key];
        if (handler) {
            e.preventDefault();
            handler();
        }
    };

    return (
        <div className={styles.group}>
            <p id={labelId} className={hideLabel ? "visually-hidden" : styles.label}>{label}</p>
            <div role="radiogroup" aria-labelledby={labelId} className={`${styles.options} ${styles[variant]}`}>
                {options.map((opt, i) => {
                    const selected = opt.value === value;
                    return (
                        <button
                            key={opt.value}
                            ref={(el) => { refs.current[i] = el; }}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            aria-label={renderOption ? opt.label : undefined}
                            disabled={opt.disabled}
                            tabIndex={opt.value === focusValue ? 0 : -1}
                            className={styles.option}
                            data-selected={selected}
                            onClick={() => onChange(opt.value)}
                            onKeyDown={(e) => onKeyDown(e, i)}
                        >
                            {renderOption ? renderOption(opt, selected) : opt.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
