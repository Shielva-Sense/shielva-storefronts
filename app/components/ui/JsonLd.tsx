/**
 * Structured data for rich results. JSON-LD must be emitted as raw script text,
 * so we serialise with JSON.stringify and escape every character that could
 * terminate the <script> element or break the JS parser (< > & U+2028 U+2029).
 * That escaping IS the sanitiser for this context — DOMPurify targets HTML,
 * not JSON. Inputs are static catalogue constants, never user content.
 */
const LINE_SEPARATORS = String.fromCharCode(0x2028, 0x2029);
const UNSAFE = new RegExp(`[<>&${LINE_SEPARATORS}]`, "g");

function escapeChar(c: string): string {
    return `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`;
}

export function JsonLd({ data }: { data: Record<string, unknown> }): React.JSX.Element {
    const json = JSON.stringify(data).replace(UNSAFE, escapeChar);
    return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
