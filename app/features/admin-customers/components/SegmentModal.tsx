"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { BrandSpinner } from "@/components/ui/ProgressOverlay";
import { formatNumber } from "@/core/formatters";
import { useDebouncedValue } from "@/core/hooks";
import { MARKETING_OPTIONS, SEGMENT_NAME_MAX, SEGMENT_NUMBER_FIELDS, TAG_MAX_LENGTH } from "../constants";
import { useSegmentPreview } from "../hooks";
import { draftToRules, EMPTY_DRAFT, rulesProblem, type SegmentDraft } from "../rules";
import type { SegmentInput, SegmentRules } from "../types";
import styles from "./SegmentModal.module.scss";

const FORM_ID = "segment-form";

interface SegmentModalProps {
    open: boolean;
    tenant: string;
    saving: boolean;
    onClose: () => void;
    onSave: (input: SegmentInput & { previewCount: number }) => void;
}

/** Rule builder with a live, debounced audience count from POST /admin/segments/preview. */
export function SegmentModal({ open, tenant, saving, onClose, onSave }: SegmentModalProps): React.JSX.Element {
    const [name, setName] = useState("");
    const [draft, setDraft] = useState<SegmentDraft>(EMPTY_DRAFT);
    const [nameError, setNameError] = useState<string | null>(null);

    const rulesJson = JSON.stringify(draftToRules(draft));
    const debouncedJson = useDebouncedValue(rulesJson, 300);
    const rules = useMemo(() => JSON.parse(debouncedJson) as SegmentRules, [debouncedJson]);
    const problem = rulesProblem(rules);
    const preview = useSegmentPreview(tenant, rules, open && problem === null);

    const setNumber = (key: keyof SegmentDraft["numbers"], value: string): void => setDraft((d) => ({ ...d, numbers: { ...d.numbers, [key]: value } }));

    const submit = (e: FormEvent<HTMLFormElement>): void => {
        e.preventDefault();
        if (!name.trim()) {
            setNameError("Give the segment a name your team will recognise.");
            return;
        }
        setNameError(null);
        const finalRules = draftToRules(draft);
        if (rulesProblem(finalRules)) return;
        onSave({ name: name.trim(), rules: finalRules, previewCount: preview.data?.count ?? 0 });
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            size="lg"
            title="New segment"
            description="A segment is a saved filter over your customers. Its count stays live as new orders arrive, and you can export it as CSV for campaigns."
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" form={FORM_ID} disabled={saving || problem !== null}>Save segment</Button>
                </>
            }
        >
            <form id={FORM_ID} className={styles.form} onSubmit={submit} noValidate>
                <Field label="Name" required {...(nameError ? { error: nameError } : {})}>
                    {(id, describedBy) => (
                        <Input id={id} value={name} maxLength={SEGMENT_NAME_MAX} onChange={(e) => setName(e.target.value)} aria-required="true" aria-invalid={nameError ? true : undefined} aria-describedby={describedBy} placeholder="e.g. VIPs, Lapsed 90 days" />
                    )}
                </Field>
                <div className={styles.grid}>
                    {SEGMENT_NUMBER_FIELDS.map((f) => (
                        <Field key={f.key} label={f.label} help={f.help}>
                            {(id, describedBy) => (
                                <Input
                                    id={id}
                                    type="number"
                                    min={f.unit === "days" ? 1 : 0}
                                    step={f.unit === "dollars" ? "0.01" : "1"}
                                    inputMode={f.unit === "dollars" ? "decimal" : "numeric"}
                                    value={draft.numbers[f.key]}
                                    onChange={(e) => setNumber(f.key, e.target.value)}
                                    aria-describedby={describedBy}
                                />
                            )}
                        </Field>
                    ))}
                    <Field label="Marketing consent">
                        {(id) => (
                            <Select id={id} value={draft.marketing} onChange={(e) => setDraft((d) => ({ ...d, marketing: e.target.value as SegmentDraft["marketing"] }))}>
                                {MARKETING_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </Select>
                        )}
                    </Field>
                    <Field label="Has tag" help="Exact tag match">
                        {(id, describedBy) => <Input id={id} value={draft.tag} maxLength={TAG_MAX_LENGTH} onChange={(e) => setDraft((d) => ({ ...d, tag: e.target.value }))} aria-describedby={describedBy} />}
                    </Field>
                </div>
                <div className={styles.preview} role="status" aria-live="polite">
                    {problem ? (
                        <span className={styles.problem}>{problem}</span>
                    ) : preview.isPending ? (
                        <BrandSpinner mode="inline" message="Counting matching customers" />
                    ) : preview.isError ? (
                        <span className={styles.problem}>Couldn&apos;t preview: {preview.error.message}</span>
                    ) : (
                        <>
                            <span className={styles.count}>{formatNumber(preview.data.count)}</span> {preview.data.count === 1 ? "customer matches" : "customers match"} right now
                            {preview.isFetching ? <BrandSpinner mode="inline" message="Updating count" /> : null}
                        </>
                    )}
                </div>
            </form>
        </Modal>
    );
}
