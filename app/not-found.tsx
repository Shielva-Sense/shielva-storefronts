import Link from "next/link";
import styles from "./status.module.scss";

export default function NotFound(): React.JSX.Element {
    return (
        <main id="main-content" tabIndex={-1} className={styles.status}>
            <h1>Page not found</h1>
            <p>The storefront you&apos;re looking for doesn&apos;t exist.</p>
            <Link href="/" className={styles.retry}>Back to the playbook</Link>
        </main>
    );
}
