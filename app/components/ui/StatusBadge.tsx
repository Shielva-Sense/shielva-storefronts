import styles from "./StatusBadge.module.scss";

export type Tone = "success" | "warning" | "danger" | "info" | "neutral";

export function StatusBadge({ tone, children, dot = true }: { tone: Tone; children: React.ReactNode; dot?: boolean }): React.JSX.Element {
    return (
        <span className={styles.badge} data-tone={tone}>
            {dot ? <span className={styles.dot} aria-hidden="true" /> : null}
            {children}
        </span>
    );
}
