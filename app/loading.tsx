import styles from "./status.module.scss";

export default function Loading(): React.JSX.Element {
    return (
        <div className={styles.loading} role="status" aria-live="polite">
            <span className={styles.bar} aria-hidden="true" />
            <span className="visually-hidden">Loading storefront…</span>
        </div>
    );
}
