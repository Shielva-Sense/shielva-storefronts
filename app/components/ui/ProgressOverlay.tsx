import styles from "./ProgressOverlay.module.scss";

/** The one screen-blocking loading surface: glass card, thin animated bar, human message. */
export function ProgressOverlay({ open, message, detail }: { open: boolean; message: string; detail?: string }): React.JSX.Element | null {
    if (!open) return null;
    return (
        <div className={styles.backdrop} role="status" aria-live="polite">
            <div className={styles.card}>
                <p className={styles.message}>{message}</p>
                {detail ? <p className={styles.detail}>{detail}</p> : null}
                <span className={styles.track} aria-hidden="true"><span className={styles.bar} /></span>
            </div>
        </div>
    );
}

/** In-page (content) or inline loading — never blocks the screen. */
export function BrandSpinner({ mode, message }: { mode: "content" | "inline"; message?: string }): React.JSX.Element {
    if (mode === "inline") return <span className={styles.dots} role="status" aria-label={message ?? "Loading"}><span /><span /><span /></span>;
    return (
        <div className={styles.content} role="status" aria-live="polite">
            <span className={styles.track} aria-hidden="true"><span className={styles.bar} /></span>
            <p className={styles.detail}>{message ?? "Loading…"}</p>
        </div>
    );
}
