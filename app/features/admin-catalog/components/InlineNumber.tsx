"use client";

import { useState, type KeyboardEvent } from "react";
import { Field, Input } from "@/components/ui/Field";
import styles from "./Catalog.module.scss";

interface InlineNumberProps {
    label: string;
    /** Committed value as shown in the input ("12.50", "40", "" for empty). */
    value: string;
    step: string;
    allowEmpty?: boolean;
    disabled: boolean;
    onCommit: (next: string) => void;
}

/** Table-cell number editor: saves on blur or Enter, Escape reverts. Parent re-keys it when the saved value changes. */
export function InlineNumber({ label, value, step, allowEmpty = false, disabled, onCommit }: InlineNumberProps): React.JSX.Element {
    const [draft, setDraft] = useState(value);

    const commit = (): void => {
        const next = draft.trim();
        if (next === value) return;
        if (!next && !allowEmpty) {
            setDraft(value);
            return;
        }
        if (next && (!Number.isFinite(Number(next)) || Number(next) < 0)) {
            setDraft(value);
            return;
        }
        onCommit(next);
    };

    const onKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === "Enter") {
            e.preventDefault();
            commit();
        } else if (e.key === "Escape") {
            setDraft(value);
        }
    };

    return (
        <span className={styles.inline}>
            <Field label={label} hideLabel>
                {(id) => (
                    <Input
                        id={id}
                        type="number"
                        min={0}
                        step={step}
                        inputMode={step === "1" ? "numeric" : "decimal"}
                        value={draft}
                        placeholder={allowEmpty ? "—" : undefined}
                        disabled={disabled}
                        onChange={(e) => setDraft(e.target.value)}
                        onBlur={commit}
                        onKeyDown={onKeyDown}
                    />
                )}
            </Field>
        </span>
    );
}
