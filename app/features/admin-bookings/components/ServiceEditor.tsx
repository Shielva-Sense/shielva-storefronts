"use client";

import { useState } from "react";
import { dollarsToCents } from "@/core/formatters";
import { Button } from "@/components/ui/Button";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { slugify } from "@/features/admin-content/constants";
import { HANDLE_RE, SERVICE_MINUTES } from "../constants";
import type { Service, ServiceInput } from "../types";
import styles from "./Bookings.module.scss";

interface ServiceEditorProps {
    service: Service | null;
    canEdit: boolean;
    onClose: () => void;
    onSave: (input: ServiceInput) => void;
}

const dollars = (cents: number): string => (cents / 100).toFixed(2).replace(/\.00$/, "");

/** Create / edit a bookable service. Handle is the upsert key, so it is fixed once created. */
export function ServiceEditor({ service, canEdit, onClose, onSave }: ServiceEditorProps): React.JSX.Element {
    const [name, setName] = useState(service?.name ?? "");
    const [handle, setHandle] = useState(service?.handle ?? "");
    const [handleTouched, setHandleTouched] = useState(service !== null);
    const [category, setCategory] = useState(service?.category ?? "");
    const [minutes, setMinutes] = useState(String(service?.minutes ?? 60));
    const [price, setPrice] = useState(service ? dollars(service.priceCents) : "");
    const [deposit, setDeposit] = useState(service ? dollars(service.depositCents) : "0");
    const [description, setDescription] = useState(service?.description ?? "");
    const [active, setActive] = useState(service?.active ?? true);
    const [submitted, setSubmitted] = useState(false);

    const priceCents = dollarsToCents(price);
    const depositCents = dollarsToCents(deposit);
    const mins = Number(minutes);
    const errors = {
        name: name.trim() ? undefined : "Give the service a name.",
        handle: HANDLE_RE.test(handle) && handle.length <= 60 ? undefined : "Lowercase letters and numbers separated by hyphens.",
        category: category.trim() ? undefined : "Group services by category, e.g. color.",
        minutes: Number.isInteger(mins) && mins >= SERVICE_MINUTES.min && mins <= SERVICE_MINUTES.max ? undefined : `Between ${SERVICE_MINUTES.min} and ${SERVICE_MINUTES.max} minutes.`,
        price: priceCents === null ? "Enter a price in dollars." : undefined,
        deposit: depositCents === null ? "Enter a deposit (0 for none)." : priceCents !== null && depositCents > priceCents ? "The deposit cannot exceed the price." : undefined,
        description: description.length > 500 ? "Keep it under 500 characters." : undefined,
    };
    const invalid = Object.values(errors).some(Boolean);
    const show = (k: keyof typeof errors): string | undefined => (submitted ? errors[k] : undefined);

    const save = (): void => {
        setSubmitted(true);
        if (invalid || !canEdit || priceCents === null || depositCents === null) return;
        onSave({ handle, name: name.trim(), category: category.trim().toLowerCase(), minutes: mins, priceCents, depositCents, description: description.trim(), active });
    };

    return (
        <Modal
            open
            onClose={onClose}
            title={service ? `Edit ${service.name}` : "New service"}
            description="Services appear on the storefront menu and in the booking widget. Deposits are charged at checkout to confirm a slot."
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={save} disabled={!canEdit || (submitted && invalid)}>Save service</Button>
                </>
            }
        >
            <div className={styles.form}>
                <Field label="Name" required error={show("name")}>
                    {(id, d) => (
                        <Input
                            id={id}
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (!handleTouched) setHandle(slugify(e.target.value).slice(0, 60));
                            }}
                            aria-describedby={d}
                            aria-invalid={Boolean(show("name"))}
                            aria-required="true"
                            disabled={!canEdit}
                        />
                    )}
                </Field>
                <div className={styles.twoCol}>
                    <Field label="Handle" required help={service ? "Fixed — it identifies the service in bookings." : "Used in booking links."} error={show("handle")}>
                        {(id, d) => (
                            <Input
                                id={id}
                                value={handle}
                                onChange={(e) => {
                                    setHandleTouched(true);
                                    setHandle(e.target.value.toLowerCase());
                                }}
                                aria-describedby={d}
                                aria-invalid={Boolean(show("handle"))}
                                aria-required="true"
                                spellCheck={false}
                                disabled={!canEdit || service !== null}
                            />
                        )}
                    </Field>
                    <Field label="Category" required error={show("category")}>
                        {(id, d) => <Input id={id} value={category} onChange={(e) => setCategory(e.target.value)} aria-describedby={d} aria-invalid={Boolean(show("category"))} aria-required="true" disabled={!canEdit} />}
                    </Field>
                </div>
                <div className={styles.threeCol}>
                    <Field label="Duration (minutes)" required error={show("minutes")}>
                        {(id, d) => <Input id={id} type="number" inputMode="numeric" min={SERVICE_MINUTES.min} max={SERVICE_MINUTES.max} step={SERVICE_MINUTES.step} value={minutes} onChange={(e) => setMinutes(e.target.value)} aria-describedby={d} aria-invalid={Boolean(show("minutes"))} aria-required="true" disabled={!canEdit} />}
                    </Field>
                    <Field label="Price ($)" required error={show("price")}>
                        {(id, d) => <Input id={id} type="number" inputMode="decimal" min={0} step={0.01} value={price} onChange={(e) => setPrice(e.target.value)} aria-describedby={d} aria-invalid={Boolean(show("price"))} aria-required="true" disabled={!canEdit} />}
                    </Field>
                    <Field label="Deposit ($)" required error={show("deposit")}>
                        {(id, d) => <Input id={id} type="number" inputMode="decimal" min={0} step={0.01} value={deposit} onChange={(e) => setDeposit(e.target.value)} aria-describedby={d} aria-invalid={Boolean(show("deposit"))} aria-required="true" disabled={!canEdit} />}
                    </Field>
                </div>
                <Field label="Description" help="Optional — shown under the service on the menu." error={show("description")}>
                    {(id, d) => <Textarea id={id} rows={3} maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)} aria-describedby={d} disabled={!canEdit} />}
                </Field>
                <Checkbox label="Active — bookable on the storefront" checked={active} onChange={setActive} disabled={!canEdit} />
            </div>
        </Modal>
    );
}
