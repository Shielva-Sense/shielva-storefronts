"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { LogOut, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, Input } from "@/components/ui/Field";
import { BrandSpinner, ProgressOverlay } from "@/components/ui/ProgressOverlay";
import { mergeCarts, useCart } from "@/core/cart/CartContext";
import { formatDateTime, formatPrice } from "@/core/formatters";
import type { StoreSlug } from "@/features/storefront/types";
import { fetchCart, saveCart } from "../api";
import { useAccountBookings, useAccountMe, useAccountOrders, useCustomerSession, useLogout, useRequestCode, useVerifyCode } from "../hooks";
import { BookingsList } from "./BookingsList";
import { OrderCard } from "./OrderCard";
import styles from "./Account.module.scss";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AccountClient({ store }: { store: StoreSlug }): React.JSX.Element {
    const session = useCustomerSession(store);
    const placed = useSearchParams().get("placed");
    const { replace } = useCart();

    // Shopify redirected back after a paid checkout: the bag has been purchased.
    useEffect(() => {
        if (placed) replace([]);
    }, [placed, replace]);

    if (session.isPending) return <div className={`container ${styles.page}`}><BrandSpinner mode="content" message="Checking your session…" /></div>;
    if (!session.data) return <SignIn store={store} placed={placed} />;
    return <Dashboard store={store} placed={placed} />;
}

function SignIn({ store, placed }: { store: StoreSlug; placed: string | null }): React.JSX.Element {
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [sent, setSent] = useState(false);
    const cart = useCart();
    const request = useRequestCode(store);
    const verify = useVerifyCode(store, async () => {
        // Merge the guest bag into the account cart so nothing is lost across devices.
        try {
            const remote = await fetchCart(store);
            const merged = mergeCarts(cart.lines, remote);
            cart.replace(merged);
            await saveCart(store, merged);
        } catch {
            // Cart sync is best-effort; the local bag is untouched.
        }
    });

    const sendCode = (e: FormEvent<HTMLFormElement>): void => {
        e.preventDefault();
        if (!EMAIL_RE.test(email)) return;
        request.mutate(email, { onSuccess: () => setSent(true) });
    };
    const confirm = (e: FormEvent<HTMLFormElement>): void => {
        e.preventDefault();
        verify.mutate({ email, code });
    };

    return (
        <div className={`container ${styles.page}`}>
            <div className={styles.signIn}>
                {placed ? (
                    <p className={styles.placed} role="status">
                        <PackageCheck size={16} aria-hidden="true" /> Thank you — order {placed} is placed. Sign in with the email you used at checkout to follow it.
                    </p>
                ) : null}
                <h1 className={`display ${styles.title}`}>Your account</h1>
                <p className={styles.lede}>Orders, payments, returns and appointments — no password needed. We&apos;ll email you a 6-digit code.</p>
                {!sent ? (
                    <form className={styles.form} onSubmit={sendCode}>
                        <Field label="Email" required>
                            {(id) => <Input id={id} type="email" autoComplete="email" required aria-required="true" value={email} onChange={(e) => setEmail(e.target.value)} />}
                        </Field>
                        <Button type="submit" size="lg" disabled={!EMAIL_RE.test(email) || request.isPending}>Email me a code</Button>
                    </form>
                ) : (
                    <form className={styles.form} onSubmit={confirm}>
                        <p className={styles.sent}>Code sent to <strong>{email}</strong>. It expires in 10 minutes.</p>
                        <Field label="6-digit code" required>
                            {(id) => (
                                <Input id={id} inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} required aria-required="true" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
                            )}
                        </Field>
                        <div className="row row-wrap">
                            <Button type="submit" size="lg" disabled={code.length !== 6 || verify.isPending}>Sign in</Button>
                            <Button variant="ghost" onClick={() => { setSent(false); setCode(""); }}>Use a different email</Button>
                        </div>
                    </form>
                )}
            </div>
            <ProgressOverlay open={request.isPending || verify.isPending} message={verify.isPending ? "Signing you in…" : "Sending your code…"} />
        </div>
    );
}

function Dashboard({ store, placed }: { store: StoreSlug; placed: string | null }): React.JSX.Element {
    const me = useAccountMe(store);
    const orders = useAccountOrders(store, placed);
    const placedOrder = placed ? orders.data?.find((o) => o.name === placed) : undefined;
    const waiting = Boolean(placed) && (!placedOrder || placedOrder.financialStatus === "pending");
    const bookings = useAccountBookings(store, store === "salon");
    const logout = useLogout(store);
    const profile = me.data;

    return (
        <div className={`container ${styles.page}`}>
            <header className={styles.head}>
                <div>
                    <h1 className={`display ${styles.title}`}>Hi{profile?.name ? `, ${profile.name}` : ""}</h1>
                    <p className={styles.lede}>{profile?.email}</p>
                </div>
                <Button variant="secondary" leftIcon={<LogOut size={14} aria-hidden="true" />} onClick={() => logout.mutate()} disabled={logout.isPending}>Sign out</Button>
            </header>

            {placed ? (
                <p className={styles.placed} role="status">
                    <PackageCheck size={16} aria-hidden="true" />
                    {waiting ? `Thank you — confirming payment for order ${placed} with Shopify…` : `Order ${placed} is confirmed and paid.`}
                </p>
            ) : null}

            <dl className={styles.stats}>
                <div><dt>Orders</dt><dd>{profile?.ordersCount ?? 0}</dd></div>
                <div><dt>Lifetime spend</dt><dd>{formatPrice((profile?.totalSpentCents ?? 0) / 100)}</dd></div>
                {profile?.memberships.length ? (
                    <div>
                        <dt>Membership</dt>
                        <dd>{profile.memberships[0]?.status === "active" ? `Active until ${formatDateTime(profile.memberships[0].currentPeriodEnd)}` : "Expired"}</dd>
                    </div>
                ) : null}
            </dl>

            {store === "salon" ? <BookingsList store={store} query={bookings} /> : null}

            <section aria-labelledby="orders-title" className={styles.section}>
                <h2 id="orders-title" className={styles.h2}>Orders</h2>
                {orders.isPending ? <BrandSpinner mode="content" message="Loading your orders…" /> : null}
                {orders.isError ? (
                    <div className={styles.error}>
                        <p>We couldn&apos;t load your orders: {orders.error.message}</p>
                        <Button variant="secondary" onClick={() => void orders.refetch()}>Try again</Button>
                    </div>
                ) : null}
                {orders.isSuccess && orders.data.length === 0 ? (
                    <EmptyState title="No orders yet" description="When you check out, your order, payment and delivery updates appear here — straight from Shopify." />
                ) : null}
                {orders.data?.map((o) => <OrderCard key={o.id} store={store} order={o} highlight={o.name === placed} />)}
            </section>
        </div>
    );
}
