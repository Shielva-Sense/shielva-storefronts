import type { ReactNode } from "react";
import styles from "./AdminLayouts.module.scss";

interface ListLayoutProps {
    title: string;
    subtitle?: string;
    headerActions?: ReactNode;
    stats?: ReactNode;
    aboveContent?: ReactNode;
    tabs?: ReactNode;
    toolbar?: ReactNode;
    children: ReactNode;
}

export function ListLayout({ title, subtitle, headerActions, stats, aboveContent, tabs, toolbar, children }: ListLayoutProps): React.JSX.Element {
    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>{title}</h1>
                    {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
                </div>
                {headerActions ? <div className={styles.actions}>{headerActions}</div> : null}
            </header>
            {stats}
            {aboveContent}
            {tabs}
            {toolbar}
            <section className={styles.content}>{children}</section>
        </div>
    );
}

interface DetailLayoutProps {
    breadcrumb: ReactNode;
    title: string;
    subtitle?: ReactNode;
    headerActions?: ReactNode;
    children: ReactNode;
}

export function DetailLayout({ breadcrumb, title, subtitle, headerActions, children }: DetailLayoutProps): React.JSX.Element {
    return (
        <div className={styles.page}>
            <nav aria-label="Breadcrumb" className={styles.breadcrumb}>{breadcrumb}</nav>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>{title}</h1>
                    {subtitle ? <div className={styles.subtitle}>{subtitle}</div> : null}
                </div>
                {headerActions ? <div className={styles.actions}>{headerActions}</div> : null}
            </header>
            <div className={styles.content}>{children}</div>
        </div>
    );
}
