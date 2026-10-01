import { Eye } from "lucide-react";
import styles from "./ReadOnlyNotice.module.scss";

/** Shown to viewer-role members: every write control on the page is disabled. */
export function ReadOnlyNotice({ what }: { what: string }): React.JSX.Element {
    return (
        <aside role="note" className={styles.notice}>
            <Eye size={16} aria-hidden="true" />
            <p>You have view-only access to this storefront. Ask an owner for the admin role to change {what}.</p>
        </aside>
    );
}
