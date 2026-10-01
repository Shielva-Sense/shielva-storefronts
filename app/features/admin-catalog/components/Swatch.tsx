import styles from "./Catalog.module.scss";

interface SwatchProps {
    /** #rrggbb, or null for an empty (dashed) swatch. */
    color: string | null;
    /** Announced name; omit when adjacent text already names the color (then it's decorative). */
    label?: string;
    size?: "sm" | "lg";
}

/** Filled color circle; the color is a runtime CSS var (the only inline style allowed). */
export function Swatch({ color, label, size = "sm" }: SwatchProps): React.JSX.Element {
    const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": true };
    return (
        <span
            className={[styles.swatch, size === "lg" ? styles.swatchLg : "", color ? "" : styles.swatchEmpty].filter(Boolean).join(" ")}
            style={color ? ({ "--swatch": color } as React.CSSProperties) : undefined}
            {...a11y}
        />
    );
}
