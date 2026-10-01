"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { TAGS_MAX } from "../constants";
import type { KnownTag } from "../types";
import { normalizeTag } from "./form-helpers";
import styles from "./Catalog.module.scss";

interface TagsEditorProps {
    tags: readonly string[];
    known: readonly KnownTag[];
    onChange: (next: string[]) => void;
}

/** Chips + free-text add + quick-add for the tags this storefront places products by. */
export function TagsEditor({ tags, known, onChange }: TagsEditorProps): React.JSX.Element {
    const baseId = useId();
    const [draft, setDraft] = useState("");
    const [error, setError] = useState<string | undefined>(undefined);

    const add = (raw: string): void => {
        const tag = normalizeTag(raw);
        if (!tag) {
            setError("Tags are lowercase letters, digits and dashes (max 40), starting with a letter or digit.");
            return;
        }
        if (tags.length >= TAGS_MAX && !tags.includes(tag)) {
            setError(`At most ${TAGS_MAX} tags.`);
            return;
        }
        setError(undefined);
        setDraft("");
        if (!tags.includes(tag)) onChange([...tags, tag]);
    };

    const onKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            if (draft.trim()) add(draft);
        }
    };

    return (
        <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Tags</legend>
            {tags.length > 0 ? (
                <ul className={styles.chips} aria-label="Current tags">
                    {tags.map((t) => (
                        <li key={t} className={styles.chip}>
                            <span>{t}</span>
                            <button type="button" className={styles.chipRemove} aria-label={`Remove tag ${t}`} onClick={() => onChange(tags.filter((x) => x !== t))}>
                                <X size={13} aria-hidden="true" />
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className={styles.help}>No tags yet. Tags decide where the storefront shows the product.</p>
            )}
            <div className={styles.addRow}>
                <Field label="Add a tag" help="Press Enter to add. Lowercase, dashes allowed." error={error}>
                    {(id, describedBy) => (
                        <Input id={id} value={draft} maxLength={40} spellCheck={false} aria-invalid={error ? true : undefined} aria-describedby={describedBy} onChange={(e) => setDraft(e.target.value)} onKeyDown={onKeyDown} />
                    )}
                </Field>
                <Button variant="secondary" size="sm" leftIcon={<Plus size={14} aria-hidden="true" />} disabled={!draft.trim()} onClick={() => add(draft)}>
                    Add tag
                </Button>
            </div>
            {known.length > 0 ? (
                <div className={styles.knownTags}>
                    <p className={styles.help}>Tags this storefront understands:</p>
                    <ul className={styles.knownList}>
                        {known.map((k) => {
                            const helpId = `${baseId}-${k.tag}`;
                            const has = tags.includes(k.tag);
                            return (
                                <li key={k.tag} className={styles.knownItem}>
                                    <Button variant="ghost" size="sm" leftIcon={<Plus size={14} aria-hidden="true" />} disabled={has} aria-describedby={helpId} onClick={() => add(k.tag)}>
                                        {has ? `${k.tag} (added)` : k.tag}
                                    </Button>
                                    <p id={helpId} className={styles.help}>{k.meaning}</p>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            ) : null}
        </fieldset>
    );
}
