import styles from "./StatSection.module.scss";
import type { Tone } from "./StatusBadge";

export interface Stat {
    label: string;
    value: string;
    hint?: string;
    tone?: Tone;
}

export function StatSection({ stats, show = true }: { stats: readonly Stat[]; show?: boolean }): React.JSX.Element | null {
    if (!show) return null;
    return (
        <dl className={styles.grid}>
            {stats.map((s) => (
                <div key={s.label} className={styles.card} data-tone={s.tone ?? "neutral"}>
                    <dt className={styles.label}>{s.label}</dt>
                    <dd className={styles.value}>{s.value}</dd>
                    {s.hint ? <dd className={styles.hint}>{s.hint}</dd> : null}
                </div>
            ))}
        </dl>
    );
}
