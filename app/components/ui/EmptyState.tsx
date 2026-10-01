import type { ReactNode } from "react";
import styles from "./EmptyState.module.scss";

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description: string; action?: ReactNode }): React.JSX.Element {
    return (
        <div className={styles.empty}>
            {icon}
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.desc}>{description}</p>
            {action}
        </div>
    );
}
