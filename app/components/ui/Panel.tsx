import type { ReactNode } from "react";
import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import styles from "./Panel.module.scss";

/** Titled surface for one block of an admin page (h2 under the layout's h1). */
export function AdminPanel({ title, description, actions, children, id }: { title: string; description?: string; actions?: ReactNode; children: ReactNode; id?: string }): React.JSX.Element {
    const headingId = id ? `${id}-title` : undefined;
    return (
        <section className={styles.panel} aria-labelledby={headingId} id={id}>
            <header className={styles.head}>
                <div>
                    <h2 id={headingId} className={styles.title}>{title}</h2>
                    {description ? <p className={styles.desc}>{description}</p> : null}
                </div>
                {actions ? <div className={styles.actions}>{actions}</div> : null}
            </header>
            <div className={styles.body}>{children}</div>
        </section>
    );
}

/** Query error surface: human message + retry. */
export function LoadError({ message, onRetry }: { message: string; onRetry: () => void }): React.JSX.Element {
    return (
        <div className={styles.error} role="alert">
            <p>{message}</p>
            <Button variant="secondary" size="sm" leftIcon={<RotateCw size={14} aria-hidden="true" />} onClick={onRetry}>Try again</Button>
        </div>
    );
}

/** Small muted paragraph used for inline "nothing here yet" notes inside a panel. */
export function PanelNote({ children }: { children: ReactNode }): React.JSX.Element {
    return <p className={styles.note}>{children}</p>;
}
