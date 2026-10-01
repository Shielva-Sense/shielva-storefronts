"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { CSV_MAX_BYTES } from "../constants";
import styles from "./Catalog.module.scss";

const FORM_ID = "catalog-import-form";

interface ImportModalProps {
    open: boolean;
    pending: boolean;
    onClose: () => void;
    onImport: (csv: string) => void;
}

/** Shopify "Export products" CSV → paste or pick a file; the API upserts products & variants by handle / SKU. */
export function ImportModal({ open, pending, onClose, onImport }: ImportModalProps): React.JSX.Element {
    const [csv, setCsv] = useState("");
    const [error, setError] = useState<string | null>(null);

    const onFile = async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > CSV_MAX_BYTES) {
            setError("That file is larger than 4 MB — split the export and import it in parts.");
            return;
        }
        setError(null);
        setCsv(await file.text());
    };

    const submit = (e: FormEvent<HTMLFormElement>): void => {
        e.preventDefault();
        if (csv.trim().length < 10) {
            setError("Paste the CSV or choose the exported file first.");
            return;
        }
        if (!csv.slice(0, 500).includes("Handle")) {
            setError("This doesn't look like a Shopify product export — the first row should include Handle, Title, Variant SKU and Variant Price.");
            return;
        }
        setError(null);
        onImport(csv);
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            size="lg"
            title="Import Shopify CSV"
            description="In Shopify admin: Products → Export → CSV for Excel or plain CSV. Products are matched by handle and variants by SKU; existing ones are updated, new ones created. Run “Sync from Shopify” afterwards to link Shopify ids."
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" form={FORM_ID} disabled={pending || !csv.trim()}>Import</Button>
                </>
            }
        >
            <form id={FORM_ID} className={styles.form} onSubmit={submit} noValidate>
                <Field label="CSV file" help="Choosing a file fills the box below.">
                    {(id, describedBy) => <Input id={id} type="file" accept=".csv,text/csv" onChange={(e) => void onFile(e)} aria-describedby={describedBy} />}
                </Field>
                <Field label="Or paste CSV" {...(error ? { error } : {})} help={csv ? `${csv.split("\n").length - 1} data rows` : "Header row first"}>
                    {(id, describedBy) => (
                        <Textarea id={id} rows={10} className={styles.mono} value={csv} onChange={(e) => setCsv(e.target.value)} aria-invalid={error ? true : undefined} aria-describedby={describedBy} spellCheck={false} />
                    )}
                </Field>
            </form>
        </Modal>
    );
}
