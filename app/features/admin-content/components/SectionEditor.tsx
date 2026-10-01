"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { AB_SPLIT, fromLocalInput, toLocalInput } from "../constants";
import type { PageSection, SectionDef, SectionField, SectionPatch, SectionProps } from "../types";
import styles from "./PageBuilder.module.scss";

interface SectionEditorProps {
    section: PageSection;
    def: SectionDef | undefined;
    canEdit: boolean;
    onClose: () => void;
    onSave: (patch: SectionPatch) => void;
}

/** Fields come from the library definition; unknown props (legacy) are still editable. */
function fieldsFor(def: SectionDef | undefined, props: SectionProps): SectionField[] {
    if (def) return def.fields;
    return Object.keys(props).map((key) => ({ key, label: key }));
}

function PropsForm({ legend, fields, values, onChange, disabled }: { legend: string; fields: SectionField[]; values: SectionProps; onChange: (key: string, value: string) => void; disabled: boolean }): React.JSX.Element {
    return (
        <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>{legend}</legend>
            <div className={styles.form}>
                {fields.map((f) => (
                    <Field key={f.key} label={f.label}>
                        {(id, d) =>
                            f.multiline ? (
                                <Textarea id={id} rows={3} maxLength={2000} value={values[f.key] ?? ""} onChange={(e) => onChange(f.key, e.target.value)} aria-describedby={d} disabled={disabled} />
                            ) : (
                                <Input id={id} maxLength={2000} value={values[f.key] ?? ""} onChange={(e) => onChange(f.key, e.target.value)} aria-describedby={d} disabled={disabled} />
                            )
                        }
                    </Field>
                ))}
            </div>
        </fieldset>
    );
}

/** Edit a section's content, A/B variant and schedule. Mount with key={section.id}. */
export function SectionEditor({ section, def, canEdit, onClose, onSave }: SectionEditorProps): React.JSX.Element {
    const fields = fieldsFor(def, section.props);
    const [propsA, setPropsA] = useState<SectionProps>(() => ({ ...section.props }));
    const [abOn, setAbOn] = useState(section.variantBProps !== null && section.abSplit > 0);
    const [propsB, setPropsB] = useState<SectionProps>(() => ({ ...(section.variantBProps ?? section.props) }));
    const [split, setSplit] = useState(String(section.abSplit > 0 ? section.abSplit : AB_SPLIT.default));
    const [starts, setStarts] = useState(() => toLocalInput(section.startsAt));
    const [ends, setEnds] = useState(() => toLocalInput(section.endsAt));

    const splitNum = Number(split);
    const splitError = abOn && (!Number.isInteger(splitNum) || splitNum < 1 || splitNum > AB_SPLIT.max) ? "Choose 1–100% of visitors for variant B." : undefined;
    const startsIso = fromLocalInput(starts);
    const endsIso = fromLocalInput(ends);
    const scheduleError = startsIso && endsIso && startsIso >= endsIso ? "The end must be after the start." : undefined;
    const invalid = Boolean(splitError ?? scheduleError);

    const save = (): void => {
        if (invalid || !canEdit) return;
        onSave({
            props: propsA,
            variantBProps: abOn ? propsB : null,
            abSplit: abOn ? splitNum : 0,
            startsAt: startsIso,
            endsAt: endsIso,
        });
    };

    return (
        <Modal
            open
            size="lg"
            onClose={onClose}
            title={`Edit ${def?.label ?? section.type}`}
            description={def?.description ?? "This section type is no longer in the library; its saved props are shown as-is."}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={save} disabled={!canEdit || invalid}>Save section</Button>
                </>
            }
        >
            <div className={styles.editor}>
                <PropsForm legend={abOn ? "Variant A (control)" : "Content"} fields={fields} values={propsA} onChange={(k, v) => setPropsA((p) => ({ ...p, [k]: v }))} disabled={!canEdit} />

                <fieldset className={styles.fieldset}>
                    <legend className={styles.legend}>A/B test</legend>
                    <Checkbox
                        label="Test a variant B of this section"
                        help="Visitors are bucketed server-side (sticky per visitor); conversion results appear on the Dashboard."
                        checked={abOn}
                        onChange={(v) => {
                            setAbOn(v);
                            if (v && section.variantBProps === null) setPropsB({ ...propsA });
                        }}
                        disabled={!canEdit}
                    />
                    {abOn ? (
                        <>
                            <Field label="Traffic to variant B (%)" help="The rest see variant A." error={splitError} required>
                                {(id, d) => <Input id={id} type="number" min={AB_SPLIT.min} max={AB_SPLIT.max} step={AB_SPLIT.step} value={split} onChange={(e) => setSplit(e.target.value)} aria-describedby={d} aria-invalid={Boolean(splitError)} className={styles.narrow} disabled={!canEdit} />}
                            </Field>
                            <PropsForm legend="Variant B" fields={fields} values={propsB} onChange={(k, v) => setPropsB((p) => ({ ...p, [k]: v }))} disabled={!canEdit} />
                        </>
                    ) : null}
                </fieldset>

                <fieldset className={styles.fieldset}>
                    <legend className={styles.legend}>Schedule</legend>
                    <p className={styles.panelSub}>Leave both empty to show the section indefinitely. Times are in your local time zone.</p>
                    <div className={styles.twoCol}>
                        <Field label="Show from">
                            {(id, d) => <Input id={id} type="datetime-local" value={starts} onChange={(e) => setStarts(e.target.value)} aria-describedby={d} disabled={!canEdit} />}
                        </Field>
                        <Field label="Hide after" error={scheduleError}>
                            {(id, d) => <Input id={id} type="datetime-local" value={ends} onChange={(e) => setEnds(e.target.value)} aria-describedby={d} aria-invalid={Boolean(scheduleError)} disabled={!canEdit} />}
                        </Field>
                    </div>
                </fieldset>
            </div>
        </Modal>
    );
}
