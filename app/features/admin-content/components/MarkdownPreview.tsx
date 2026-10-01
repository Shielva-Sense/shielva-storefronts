"use client";

import Markdown from "react-markdown";
import styles from "./Content.module.scss";

/** Rendered markdown preview. Raw HTML is never enabled (no rehype-raw), so embedded tags render as text. */
export default function MarkdownPreview({ source }: { source: string }): React.JSX.Element {
    return (
        <div className={styles.markdown}>
            <Markdown skipHtml>{source}</Markdown>
        </div>
    );
}
