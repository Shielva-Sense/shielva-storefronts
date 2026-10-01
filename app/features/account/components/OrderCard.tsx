"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { ChoiceGroup } from "@/components/ui/ChoiceGroup";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateTime, formatPrice, humanize } from "@/core/formatters";
import type { StoreSlug } from "@/features/storefront/types";
import { FINANCIAL_TONE, FULFILLMENT_TONE, RETURN_TONE } from "../constants";
import { useRequestReturn, useSubmitReview } from "../hooks";
import type { AccountOrder, AccountOrderLine } from "../types";
import styles from "./Account.module.scss";

const RETURN_TYPES = [
    { value: "return", label: "Refund" },
    { value: "exchange", label: "Exchange" },
] as const;
const RATINGS = [5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n} star${n === 1 ? "" : "s"}` }));

export function OrderCard({ store, order, highlight }: { store: StoreSlug; order: AccountOrder; highlight: boolean }): React.JSX.Element {
    const [returnOpen, setReturnOpen] = useState(false);
    const [reviewLine, setReviewLine] = useState<AccountOrderLine | null>(null);
    const paid = ["paid", "partially_refunded"].includes(order.financialStatus);
    const cents = (c: number): string => formatPrice(c / 100);

    return (
        <article className={styles.order} data-highlight={highlight} aria-labelledby={`order-${order.id}`}>
            <header className={styles.orderHead}>
                <div>
                    <h3 id={`order-${order.id}`} className={styles.orderName}>Order {order.name}</h3>
                    <p className={styles.muted}>{formatDateTime(order.createdAt)}</p>
                </div>
                <div className="row row-wrap">
                    <StatusBadge tone={order.cancelledAt ? "danger" : (FINANCIAL_TONE[order.financialStatus] ?? "neutral")}>{order.cancelledAt ? "Cancelled" : humanize(order.financialStatus)}</StatusBadge>
                    <StatusBadge tone={FULFILLMENT_TONE[order.fulfillmentStatus ?? ""] ?? "warning"}>{order.fulfillmentStatus ? humanize(order.fulfillmentStatus) : "Preparing"}</StatusBadge>
                </div>
            </header>

            <ul className={styles.lines}>
                {order.lines.map((l) => (
                    <li key={l.id}>
                        <span>{l.title}{l.variantTitle ? ` — ${l.variantTitle}` : ""} × {l.quantity}</span>
                        <span className={styles.lineEnd}>
                            {cents(l.priceCents * l.quantity)}
                            {paid && l.sku && !l.reviewed ? <Button size="sm" variant="ghost" onClick={() => setReviewLine(l)}>Review</Button> : null}
                            {l.reviewed ? <span className={styles.muted}>Reviewed</span> : null}
                        </span>
                    </li>
                ))}
            </ul>
            <p className={styles.total}>
                Total <strong>{cents(order.totalCents)}</strong>
                {order.totalRefundedCents > 0 ? <span className={styles.muted}> · refunded {cents(order.totalRefundedCents)}</span> : null}
            </p>

            <details className={styles.details} open={highlight}>
                <summary>Payments &amp; transactions</summary>
                {order.transactions.length === 0 ? (
                    <p className={styles.muted}>Waiting for Shopify to report the payment…</p>
                ) : (
                    <table className={styles.txns}>
                        <caption className="visually-hidden">Transactions for order {order.name}</caption>
                        <thead><tr><th scope="col">Type</th><th scope="col">Method</th><th scope="col">Amount</th><th scope="col">Status</th><th scope="col">When</th></tr></thead>
                        <tbody>
                            {order.transactions.map((t) => (
                                <tr key={t.id}>
                                    <td>{humanize(t.kind)}</td>
                                    <td>{humanize(t.gateway)}</td>
                                    <td>{t.kind === "refund" ? "−" : ""}{cents(t.amountCents)}</td>
                                    <td><StatusBadge tone={t.status === "success" ? "success" : t.status === "pending" ? "warning" : "danger"}>{humanize(t.status)}</StatusBadge></td>
                                    <td>{formatDateTime(t.processedAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </details>

            {order.shipments.length > 0 ? (
                <details className={styles.details}>
                    <summary>Delivery</summary>
                    <ul className={styles.plain}>
                        {order.shipments.map((s) => (
                            <li key={`${s.trackingNumber ?? ""}-${s.createdAt}`}>
                                {s.trackingCompany ?? "Carrier"} {s.trackingNumber ?? ""}{" "}
                                {s.trackingUrl ? <a href={s.trackingUrl} target="_blank" rel="noopener noreferrer">Track package</a> : null}
                            </li>
                        ))}
                    </ul>
                </details>
            ) : null}

            <details className={styles.details}>
                <summary>Timeline</summary>
                <ol className={styles.timeline}>
                    {order.timeline.map((e) => (
                        <li key={`${e.at}-${e.type}`}><time dateTime={e.at}>{formatDateTime(e.at)}</time> {e.message}</li>
                    ))}
                </ol>
            </details>

            {order.returns.length > 0 ? (
                <ul className={styles.plain}>
                    {order.returns.map((r) => (
                        <li key={r.id}><StatusBadge tone={RETURN_TONE[r.status] ?? "neutral"}>{humanize(r.type)}: {humanize(r.status)}</StatusBadge> <span className={styles.muted}>{r.reason}</span></li>
                    ))}
                </ul>
            ) : null}

            {order.canReturn ? <Button variant="secondary" size="sm" onClick={() => setReturnOpen(true)}>Return or exchange</Button> : null}

            {returnOpen ? <ReturnModal store={store} order={order} onClose={() => setReturnOpen(false)} /> : null}
            {reviewLine ? <ReviewModal store={store} line={reviewLine} onClose={() => setReviewLine(null)} /> : null}
        </article>
    );
}

function ReturnModal({ store, order, onClose }: { store: StoreSlug; order: AccountOrder; onClose: () => void }): React.JSX.Element {
    const [type, setType] = useState<"return" | "exchange">("return");
    const [reason, setReason] = useState("");
    const [qty, setQty] = useState<Record<string, number>>({});
    const request = useRequestReturn(store);
    const lines = Object.entries(qty).filter(([, q]) => q > 0).map(([sku, quantity]) => ({ sku, quantity }));

    const submit = (e: FormEvent<HTMLFormElement>): void => {
        e.preventDefault();
        request.mutate({ orderId: order.id, type, reason, lines }, { onSuccess: onClose });
    };

    return (
        <Modal open onClose={onClose} title={`Return or exchange — ${order.name}`} description="Free returns within 30 days. Refunds go back to your original payment method through Shopify Payments.">
            <form className={styles.form} onSubmit={submit}>
                <ChoiceGroup label="What would you like?" options={RETURN_TYPES} value={type} onChange={setType} />
                {order.lines.filter((l) => l.sku).map((l) => (
                    <Field key={l.id} label={`${l.title}${l.variantTitle ? ` — ${l.variantTitle}` : ""}`}>
                        {(id) => (
                            <Select id={id} value={String(qty[l.sku as string] ?? 0)} onChange={(e) => setQty((q) => ({ ...q, [l.sku as string]: Number(e.target.value) }))}>
                                {Array.from({ length: l.quantity + 1 }, (_, n) => <option key={n} value={n}>{n === 0 ? "Keep" : `Return ${n}`}</option>)}
                            </Select>
                        )}
                    </Field>
                ))}
                <Field label="Reason" required>
                    {(id) => <Textarea id={id} required aria-required="true" minLength={3} value={reason} onChange={(e) => setReason(e.target.value)} />}
                </Field>
                <div className="row row-end">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" disabled={lines.length === 0 || reason.trim().length < 3 || request.isPending}>Send request</Button>
                </div>
            </form>
        </Modal>
    );
}

function ReviewModal({ store, line, onClose }: { store: StoreSlug; line: AccountOrderLine; onClose: () => void }): React.JSX.Element {
    const [rating, setRating] = useState("5");
    const [body, setBody] = useState("");
    const [author, setAuthor] = useState("");
    const submit = useSubmitReview(store);

    const send = (e: FormEvent<HTMLFormElement>): void => {
        e.preventDefault();
        submit.mutate({ sku: line.sku as string, rating: Number(rating), body, authorName: author }, { onSuccess: onClose });
    };

    return (
        <Modal open onClose={onClose} title={`Review ${line.title}`} description="Reviews from verified buyers get a badge and appear after a quick check.">
            <form className={styles.form} onSubmit={send}>
                <ChoiceGroup label="Rating" options={RATINGS} value={rating} onChange={setRating} />
                <Field label="Display name" required>
                    {(id) => <Input id={id} required aria-required="true" value={author} onChange={(e) => setAuthor(e.target.value)} />}
                </Field>
                <Field label="Your review" required help="At least 10 characters.">
                    {(id, describedBy) => <Textarea id={id} required aria-required="true" aria-describedby={describedBy} minLength={10} value={body} onChange={(e) => setBody(e.target.value)} />}
                </Field>
                <div className="row row-end">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" disabled={body.trim().length < 10 || !author.trim() || submit.isPending}>Submit review</Button>
                </div>
            </form>
        </Modal>
    );
}
