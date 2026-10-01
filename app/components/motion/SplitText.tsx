import { Fragment, type CSSProperties, type ElementType } from "react";
import type { EditAttrs } from "@/features/inline-edit/markers";

interface SplitTextProps {
    text: string;
    as?: ElementType;
    className?: string;
    /** Inline-edit markers (admins only). */
    edit?: EditAttrs;
}

/**
 * Word-by-word mask reveal. Screen readers and crawlers get the plain sentence
 * (visually-hidden); the animated word spans are aria-hidden.
 */
export function SplitText({ text, as: Tag = "span", className, edit }: SplitTextProps): React.JSX.Element {
    const words = text.split(" ");
    return (
        <Tag className={className} data-reveal="words" {...edit}>
            <span className="visually-hidden">{text}</span>
            <span aria-hidden="true">
                {words.map((word, i) => (
                    <Fragment key={`${word}-${i}`}>
                        <span className="split-word" style={{ "--w": i } as CSSProperties}>
                            <span>{word}</span>
                        </span>
                        {i < words.length - 1 ? " " : null}
                    </Fragment>
                ))}
            </span>
        </Tag>
    );
}
