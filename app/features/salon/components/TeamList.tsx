"use client";

import type { CSSProperties } from "react";
import { formatPrice } from "@/core/formatters";
import { SALON_STYLISTS } from "../constants";
import { useBookingCatalog } from "../hooks";
import { useSalonBooking } from "../SalonBookingContext";
import type { BookingCatalog } from "../types";
import styles from "./Salon.module.scss";

/** Stylists from the booking API; "Book with" pre-selects them in the widget. */
export function TeamList({ initial }: { initial: BookingCatalog | null }): React.JSX.Element {
    const catalog = useBookingCatalog(initial);
    const { bookService } = useSalonBooking();
    const team = catalog.data?.staff.length
        ? catalog.data.staff
        : SALON_STYLISTS.filter((s) => s.id !== "any").map((s) => ({ handle: s.id, name: s.name, level: s.level, specialty: s.specialty, services: [] as string[] }));
    const services = catalog.data?.services ?? [];

    return (
        <ul className={styles.stylists}>
            {team.map((s, i) => {
                const theirs = services.filter((x) => s.services.includes(x.handle));
                const from = theirs.length ? Math.min(...theirs.map((x) => x.priceCents)) / 100 : null;
                return (
                    <li key={s.handle} className={styles.stylist} data-reveal="rise" style={{ "--i": i } as CSSProperties}>
                        <span className={styles.portrait} aria-hidden="true" style={{ "--i": i } as CSSProperties}>
                            {s.name.split(" ").map((n) => n[0]).join("")}
                        </span>
                        <div>
                            <h3 className={styles.stylistName}>{s.name}</h3>
                            <p className={styles.stylistMeta}>{s.level} · {s.specialty}</p>
                            <p className={styles.slot}>
                                {from !== null ? <>from <strong>{formatPrice(from)}</strong> · </> : null}
                                <button type="button" className={styles.bookWith} onClick={() => bookService(theirs[0]?.handle ?? "signature-cut", s.handle)}>
                                    Book with {s.name.split(" ")[0]}
                                </button>
                            </p>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}
