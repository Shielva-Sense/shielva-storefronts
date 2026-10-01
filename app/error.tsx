"use client";

import { useEffect } from "react";
import { logError } from "@/core/error-logger";
import styles from "./status.module.scss";

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }): React.JSX.Element {
    useEffect(() => {
        logError(error, { digest: error.digest });
    }, [error]);
    return (
        <main id="main-content" tabIndex={-1} className={styles.status}>
            <h1>Something went wrong</h1>
            <p>We couldn&apos;t load this page. Please try again.</p>
            <button type="button" onClick={reset} className={styles.retry}>Try again</button>
        </main>
    );
}
