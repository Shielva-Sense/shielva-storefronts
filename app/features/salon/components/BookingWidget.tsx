"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ChoiceGroup, type ChoiceOption } from "@/components/ui/ChoiceGroup";
import { Field, Input, Select } from "@/components/ui/Field";
import { BrandSpinner, ProgressOverlay } from "@/components/ui/ProgressOverlay";
import { openOutsideFrame } from "@/core/frame";
import { formatPrice } from "@/core/formatters";
import { CATEGORY_LABEL } from "../constants";
import { useAvailability, useBookingCatalog, useHoldBooking } from "../hooks";
import { useSalonBooking } from "../SalonBookingContext";
import type { BookingCatalog } from "../types";
import styles from "./BookingWidget.module.scss";

const DAYS_AHEAD = 7;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function upcomingDays(timeZone: string): ChoiceOption<string>[] {
    const iso = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
    const label = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short", month: "short", day: "numeric" });
    return Array.from({ length: DAYS_AHEAD }, (_, i) => {
        const d = new Date(Date.now() + i * 86_400_000);
        return { value: iso.format(d), label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : label.format(d) };
    });
}

export function BookingWidget({ initial }: { initial: BookingCatalog | null }): React.JSX.Element {
    const { serviceId, setServiceId, staffHandle, setStaffHandle } = useSalonBooking();
    const catalog = useBookingCatalog(initial);
    const [days, setDays] = useState<ChoiceOption<string>[]>([]);
    const [day, setDay] = useState<string | null>(null);
    const [slot, setSlot] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [confirmedAt, setConfirmedAt] = useState<string | null>(null);

    const timezone = catalog.data?.timezone ?? "America/New_York";
    // Dates depend on the visitor's clock — compute after mount to avoid SSR/client drift.
    useEffect(() => {
        const list = upcomingDays(timezone);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- client clock only exists after hydration
        setDays(list);
        setDay((d) => d ?? list[0]?.value ?? null);
    }, [timezone]);

    const services = useMemo(() => catalog.data?.services ?? [], [catalog.data]);
    const service = services.find((s) => s.handle === serviceId) ?? services[0];
    const stylists = (catalog.data?.staff ?? []).filter((s) => service && s.services.includes(service.handle));
    const staff = stylists.some((s) => s.handle === staffHandle) ? staffHandle : null;
    const availability = useAvailability(service?.handle ?? "", day, staff);
    const hold = useHoldBooking(service?.handle ?? "", day, staff);
    const categories = [...new Set(services.map((s) => s.category))];

    const slotOptions: ChoiceOption<string>[] = (availability.data ?? []).map((s) => ({ value: s.startsAt, label: s.label }));
    const emailError = email && !EMAIL_RE.test(email) ? "Enter a valid email address" : undefined;
    const ready = Boolean(service && slot && name.trim() && EMAIL_RE.test(email));

    const submit = (e: FormEvent<HTMLFormElement>): void => {
        e.preventDefault();
        if (!service || !slot || !ready) return;
        hold.mutate(
            { service: service.handle, ...(staff ? { staff } : {}), startsAt: slot, name: name.trim(), email },
            {
                onSuccess: (res) => {
                    // Deposit services pay on Shopify's hosted checkout; the paid webhook confirms the booking.
                    if (res.checkoutUrl) openOutsideFrame(res.checkoutUrl);
                    else setConfirmedAt(slotOptions.find((s) => s.value === slot)?.label ?? "");
                    setSlot(null);
                },
            },
        );
    };

    if (catalog.isPending) return <div id="book" className={styles.widget}><BrandSpinner mode="content" message="Loading live availability…" /></div>;
    if (catalog.isError || !service) {
        return (
            <div id="book" className={styles.widget}>
                <p className={styles.fine}>Online booking is temporarily unavailable. Call the studio and we&apos;ll fit you in.</p>
            </div>
        );
    }

    if (confirmedAt !== null) {
        return (
            <div id="book" className={styles.widget} role="status">
                <p className={styles.done}>You&apos;re booked: {service.name}{confirmedAt ? ` at ${confirmedAt}` : ""}.</p>
                <p className={styles.fine}>A confirmation is on its way to {email}. Manage or cancel it from your account.</p>
                <div className="row row-wrap">
                    <Link href="/salon/account" className={styles.link}>View my bookings</Link>
                    <Button variant="secondary" onClick={() => setConfirmedAt(null)}>Book another</Button>
                </div>
            </div>
        );
    }

    return (
        <form id="book" className={styles.widget} onSubmit={submit} aria-label="Book an appointment">
            <div className={styles.row}>
                <Field label="Service">
                    {(id) => (
                        <Select id={id} value={service.handle} onChange={(e) => { setServiceId(e.target.value); setSlot(null); }}>
                            {categories.map((cat) => (
                                <optgroup key={cat} label={CATEGORY_LABEL[cat as keyof typeof CATEGORY_LABEL] ?? cat}>
                                    {services.filter((s) => s.category === cat).map((s) => (
                                        <option key={s.handle} value={s.handle}>{s.name}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </Select>
                    )}
                </Field>
                <Field label="Stylist">
                    {(id) => (
                        <Select id={id} value={staff ?? ""} onChange={(e) => { setStaffHandle(e.target.value || null); setSlot(null); }}>
                            <option value="">First available</option>
                            {stylists.map((s) => <option key={s.handle} value={s.handle}>{s.name} · {s.level}</option>)}
                        </Select>
                    )}
                </Field>
            </div>

            {days.length > 0 ? <ChoiceGroup label="Day" options={days} value={day} onChange={(d) => { setDay(d); setSlot(null); }} /> : null}

            <div className={styles.slots} aria-live="polite">
                {availability.isPending && day ? <BrandSpinner mode="content" message="Checking the book…" /> : null}
                {availability.isSuccess && slotOptions.length === 0 ? <p className={styles.fine}>Fully booked that day — try another day or stylist.</p> : null}
                {slotOptions.length > 0 ? <ChoiceGroup label="Time" options={slotOptions} value={slot} onChange={setSlot} /> : null}
            </div>

            {slot ? (
                <div className={styles.row}>
                    <Field label="Your name" required>
                        {(id) => <Input id={id} autoComplete="name" required aria-required="true" value={name} onChange={(e) => setName(e.target.value)} />}
                    </Field>
                    <Field label="Email" required {...(emailError ? { error: emailError } : {})}>
                        {(id, describedBy) => (
                            <Input id={id} type="email" autoComplete="email" required aria-required="true" aria-invalid={emailError ? true : undefined} aria-describedby={describedBy} value={email} onChange={(e) => setEmail(e.target.value)} />
                        )}
                    </Field>
                </div>
            ) : null}

            <div className={styles.summary}>
                <p>
                    <strong>{service.name}</strong> · {service.minutes} min · from {formatPrice(service.priceCents / 100)}
                    {service.depositCents > 0 ? <> · {formatPrice(service.depositCents / 100)} deposit</> : null}
                </p>
                <Button type="submit" size="lg" leftIcon={<CalendarCheck size={14} aria-hidden="true" />} disabled={!ready || hold.isPending}>
                    {service.depositCents > 0 ? "Hold & pay deposit" : "Reserve"}
                </Button>
            </div>
            <p className={styles.fine}>
                {service.depositCents > 0
                    ? "We hold your chair for 10 minutes while you pay the deposit on Shopify's secure checkout. Free cancellation up to 12h before."
                    : "No payment now · free cancellation up to 12h before"}
            </p>
            <ProgressOverlay open={hold.isPending} message="Holding your chair…" detail={service.depositCents > 0 ? "Then we'll take you to secure checkout" : "Confirming with the studio"} />
        </form>
    );
}
