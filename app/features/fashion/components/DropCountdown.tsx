"use client";

import { useEffect, useState } from "react";
import styles from "./DropCountdown.module.scss";

const DROP_WEEKDAY = 5; // Friday
const DROP_HOUR = 10;

function nextDrop(now: Date): Date {
    const d = new Date(now);
    d.setHours(DROP_HOUR, 0, 0, 0);
    const add = (DROP_WEEKDAY - d.getDay() + 7) % 7;
    d.setDate(d.getDate() + add);
    if (d <= now) d.setDate(d.getDate() + 7);
    return d;
}

const UNITS = [
    { label: "Days", ms: 86_400_000 },
    { label: "Hours", ms: 3_600_000 },
    { label: "Min", ms: 60_000 },
] as const;

/** Weekly drop timer — ticks once a minute (no 1s polling). */
export function DropCountdown(): React.JSX.Element {
    const [remaining, setRemaining] = useState<number | null>(null);

    useEffect(() => {
        const tick = (): void => {
            const now = new Date();
            setRemaining(nextDrop(now).getTime() - now.getTime());
        };
        tick();
        const id = window.setInterval(tick, 60_000);
        return () => window.clearInterval(id);
    }, []);

    const parts = UNITS.map((u, i) => {
        // Remainder after all larger units, then whole units of this size.
        const larger = UNITS[i - 1];
        const within = remaining === null ? 0 : larger ? remaining % larger.ms : remaining;
        const v = Math.floor(within / u.ms);
        return { label: u.label, value: remaining === null ? "--" : String(v).padStart(2, "0") };
    });

    return (
        <dl className={styles.timer} aria-label="Time until the next drop">
            {parts.map((p) => (
                <div key={p.label}>
                    <dd>{p.value}</dd>
                    <dt>{p.label}</dt>
                </div>
            ))}
        </dl>
    );
}
