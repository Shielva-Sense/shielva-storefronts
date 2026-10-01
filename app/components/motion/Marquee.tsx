import type { EditAttrs } from "@/features/inline-edit/markers";
import styles from "./Marquee.module.scss";

/** Infinite ticker. Pure CSS (transform keyframes); duplicated track is aria-hidden. */
export function Marquee({ items, label, itemEdits }: { items: readonly string[]; label: string; itemEdits?: readonly EditAttrs[] }): React.JSX.Element {
    return (
        <section className={styles.marquee} aria-label={label}>
            <ul className={styles.track}>
                {items.map((item, i) => (
                    <li key={item} className={styles.item}><span {...itemEdits?.[i]}>{item}</span></li>
                ))}
            </ul>
            <ul className={styles.track} aria-hidden="true">
                {items.map((item) => (
                    <li key={`dup-${item}`} className={styles.item}>{item}</li>
                ))}
            </ul>
        </section>
    );
}
