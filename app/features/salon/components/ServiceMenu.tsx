"use client";

import { useState } from "react";
import { Clock } from "lucide-react";
import { TabNav } from "@/components/ui/TabNav";
import { formatPrice } from "@/core/formatters";
import { CATEGORY_LABEL, SALON_SERVICES } from "../constants";
import { useBookingCatalog } from "../hooks";
import { useSalonBooking } from "../SalonBookingContext";
import type { BookableService, BookingCatalog } from "../types";
import styles from "./ServiceMenu.module.scss";

/** Built-in menu used only if the booking API is unreachable. */
const FALLBACK: BookableService[] = SALON_SERVICES.map((s) => ({ handle: s.id, name: s.name, category: s.category, minutes: s.minutes, priceCents: s.from * 100, depositCents: 0, description: s.description }));

export function ServiceMenu({ initial }: { initial: BookingCatalog | null }): React.JSX.Element {
    const catalog = useBookingCatalog(initial);
    const services = catalog.data?.services.length ? catalog.data.services : FALLBACK;
    const categories = [...new Set(services.map((s) => s.category))];
    const [active, setActive] = useState<string>(categories[0] ?? "hair");
    const { bookService } = useSalonBooking();
    const tabs = categories.map((id) => ({ id, label: CATEGORY_LABEL[id as keyof typeof CATEGORY_LABEL] ?? id, count: services.filter((s) => s.category === id).length }));

    return (
        <div className={styles.menu}>
            <TabNav label="Service categories" idPrefix="services" tabs={tabs} active={active} onChange={setActive} />
            <div id="services-panel" role="tabpanel" aria-labelledby={`services-tab-${active}`}>
                <ul className={styles.list}>
                    {services.filter((s) => s.category === active).map((s, i) => (
                        <li key={s.handle} className={styles.item} style={{ "--i": i } as React.CSSProperties}>
                            <div className={styles.main}>
                                <h3 className={styles.name}>{s.name}</h3>
                                <p className={styles.desc}>{s.description}</p>
                            </div>
                            <p className={styles.meta}>
                                <span className={styles.time}><Clock size={13} aria-hidden="true" /> {s.minutes} min</span>
                                <span className={styles.price}>from {formatPrice(s.priceCents / 100)}</span>
                            </p>
                            <button type="button" className={styles.book} onClick={() => bookService(s.handle)}>
                                Book<span className="visually-hidden"> {s.name}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
