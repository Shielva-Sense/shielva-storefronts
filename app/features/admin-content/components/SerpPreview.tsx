"use client";

import { useSyncExternalStore } from "react";
import styles from "./Content.module.scss";

const noopSubscribe = (): (() => void) => () => undefined;
const readHost = (): string => window.location.host;
const serverHost = (): string => "";

interface SerpPreviewProps {
    title: string;
    path: string;
    description: string;
}

/** Google-style search-result snippet so admins see how the page reads in results. */
export function SerpPreview({ title, path, description }: SerpPreviewProps): React.JSX.Element {
    const host = useSyncExternalStore(noopSubscribe, readHost, serverHost);
    const crumbs = path.split("/").filter(Boolean);
    return (
        <figure className={styles.serp} aria-label="Search result preview">
            <figcaption className={styles.serpCaption}>Search result preview</figcaption>
            <p className={styles.serpUrl}>
                <span className={styles.serpHost}>{host || "your-store"}</span>
                {crumbs.map((c, i) => (
                    <span key={crumbs.slice(0, i + 1).join("/")}> › {c}</span>
                ))}
            </p>
            <p className={styles.serpTitle}>{title || "Add an SEO title"}</p>
            <p className={styles.serpDesc}>{description || "Add a meta description — it is the sales pitch under your link."}</p>
        </figure>
    );
}
