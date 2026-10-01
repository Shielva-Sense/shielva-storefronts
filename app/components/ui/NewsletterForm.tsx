"use client";

import { useState, type FormEvent } from "react";
import { Button } from "./Button";
import { Field, Input } from "./Field";
import { toast } from "./Toast";
import styles from "./NewsletterForm.module.scss";
import type { EditAttrs } from "@/features/inline-edit/markers";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function NewsletterForm({ label, cta, success, ctaEdit }: { label: string; cta: string; success: string; ctaEdit?: EditAttrs }): React.JSX.Element {
    const [email, setEmail] = useState("");
    const [error, setError] = useState<string | undefined>(undefined);

    const submit = (e: FormEvent<HTMLFormElement>): void => {
        e.preventDefault();
        if (!EMAIL_RE.test(email)) {
            setError("Enter a valid email address");
            return;
        }
        setError(undefined);
        setEmail("");
        toast.success(success);
    };

    return (
        <form className={styles.form} onSubmit={submit} noValidate>
            <Field label={label} hideLabel required {...(error ? { error } : {})}>
                {(id, describedBy) => (
                    <Input
                        id={id}
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={email}
                        aria-required="true"
                        aria-invalid={error ? true : undefined}
                        aria-describedby={describedBy}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                )}
            </Field>
            <Button type="submit" variant="accent"><span {...ctaEdit}>{cta}</span></Button>
        </form>
    );
}
