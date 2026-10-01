"use client";

import { useState, type FormEvent } from "react";
import { centsToInput, dollarsToCents, formatCents } from "@/core/formatters";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import type { OrderDetail, RefundInput } from "../types";
import styles from "./RefundModal.module.scss";

const FORM_ID = "refund-form";
const NOTE_MAX = 300;

interface RefundModalProps {
    open: boolean;
    detail: OrderDetail;
    pending: boolean;
    onClose: () => void;
    /** Receives a validated request; the parent confirms and submits it. */
    onSubmit: (input: RefundInput) => void;
}

/** Refund form: amount in dollars (sent as cents), a required note, optional per-line restock quantities. */
export function RefundModal({ open, detail, pending, onClose, onSubmit }: RefundModalProps): React.JSX.Element {
    const refundableCents = Math.max(0, detail.order.totalCents - detail.order.totalRefundedCents);
    const [amount, setAmount] = useState(() => centsToInput(refundableCents));
    const [note, setNote] = useState("");
    const [qty, setQty] = useState<Record<string, string>>({});
    const [errors, setErrors] = useState<{ amount?: string; note?: string }>({});

    const lineTotal = detail.lines.reduce((n, l) => n + (Number.parseInt(qty[l.shopifyLineId] ?? "0", 10) || 0) * l.priceCents, 0);

    const submit = (e: FormEvent<HTMLFormElement>): void => {
        e.preventDefault();
        const cents = dollarsToCents(amount);
        const next: { amount?: string; note?: string } = {};
        if (cents === null || cents < 1) next.amount = "Enter an amount greater than zero.";
        else if (cents > refundableCents) next.amount = `At most ${formatCents(refundableCents)} can still be refunded.`;
        if (!note.trim()) next.note = "Add a short reason — it is stored on the Shopify refund and the order timeline.";
        setErrors(next);
        if (next.amount || next.note || cents === null) return;
        const lines = detail.lines.flatMap((l) => {
            const q = Math.min(l.quantity, Number.parseInt(qty[l.shopifyLineId] ?? "0", 10) || 0);
            return q > 0 ? [{ lineId: l.shopifyLineId, quantity: q }] : [];
        });
        onSubmit({ amountCents: cents, note: note.trim(), lines });
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            size="lg"
            title={`Refund ${detail.order.name}`}
            description="Shopify Payments moves the money back to the customer's card. This page updates automatically when Shopify's refund webhook arrives (usually within a few seconds)."
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button variant="danger" type="submit" form={FORM_ID} disabled={pending}>Review refund</Button>
                </>
            }
        >
            <form id={FORM_ID} className={styles.form} onSubmit={submit} noValidate>
                <Field label="Amount (USD)" required help={`Up to ${formatCents(refundableCents)} is refundable.`} {...(errors.amount ? { error: errors.amount } : {})}>
                    {(id, describedBy) => (
                        <Input
                            id={id}
                            type="number"
                            inputMode="decimal"
                            min="0.01"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            aria-required="true"
                            aria-invalid={errors.amount ? true : undefined}
                            aria-describedby={describedBy}
                        />
                    )}
                </Field>
                <Field label="Reason" required help={`${note.length}/${NOTE_MAX} characters`} {...(errors.note ? { error: errors.note } : {})}>
                    {(id, describedBy) => (
                        <Textarea
                            id={id}
                            rows={3}
                            maxLength={NOTE_MAX}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            aria-required="true"
                            aria-invalid={errors.note ? true : undefined}
                            aria-describedby={describedBy}
                        />
                    )}
                </Field>
                {detail.lines.length > 0 ? (
                    <fieldset className={styles.lines}>
                        <legend className={styles.legend}>Restock lines (optional)</legend>
                        <p className={styles.help}>Quantities are restocked in Shopify. The amount above is what is refunded.</p>
                        <ul className={styles.lineList}>
                            {detail.lines.map((l) => (
                                <li key={l.id} className={styles.line}>
                                    <span className={styles.lineTitle}>
                                        {l.title}
                                        {l.variantTitle ? <span className={styles.muted}> · {l.variantTitle}</span> : null}
                                        <span className={styles.muted}> — {l.quantity} × {formatCents(l.priceCents)}</span>
                                    </span>
                                    <Field label={`Quantity to refund for ${l.title}`} hideLabel>
                                        {(id) => (
                                            <Input
                                                id={id}
                                                type="number"
                                                min={0}
                                                max={l.quantity}
                                                step={1}
                                                placeholder="0"
                                                value={qty[l.shopifyLineId] ?? ""}
                                                onChange={(e) => setQty((prev) => ({ ...prev, [l.shopifyLineId]: e.target.value }))}
                                            />
                                        )}
                                    </Field>
                                </li>
                            ))}
                        </ul>
                        {lineTotal > 0 ? (
                            <Button variant="ghost" size="sm" onClick={() => setAmount(centsToInput(Math.min(lineTotal, refundableCents)))}>
                                Use line total ({formatCents(Math.min(lineTotal, refundableCents))})
                            </Button>
                        ) : null}
                    </fieldset>
                ) : null}
            </form>
        </Modal>
    );
}
