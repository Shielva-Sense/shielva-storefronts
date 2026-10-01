import { Star } from "lucide-react";
import { formatNumber } from "@/core/formatters";
import styles from "./StarRating.module.scss";

const STARS = [1, 2, 3, 4, 5] as const;

export function StarRating({ value, count }: { value: number; count?: number }): React.JSX.Element {
    return (
        <span className={styles.rating}>
            <span className={styles.stars} aria-hidden="true">
                {STARS.map((s) => (
                    <Star key={s} size={13} className={s <= Math.round(value) ? styles.on : styles.off} />
                ))}
            </span>
            <span className={styles.label}>
                {value.toFixed(1)}
                {count !== undefined ? <span className={styles.count}> ({formatNumber(count)})</span> : null}
                <span className="visually-hidden"> out of 5 stars</span>
            </span>
        </span>
    );
}
