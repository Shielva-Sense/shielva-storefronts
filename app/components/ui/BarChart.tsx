import styles from "./BarChart.module.scss";

export interface BarDatum {
    label: string;
    value: number;
    display: string;
}

/** Dependency-free SVG bar chart (no charting lib in the bundle). Values are also listed for screen readers. */
export function BarChart({ data, title }: { data: readonly BarDatum[]; title: string }): React.JSX.Element {
    const max = Math.max(1, ...data.map((d) => d.value));
    const w = 100 / Math.max(1, data.length);
    return (
        <figure className={styles.figure}>
            <figcaption className={styles.caption}>{title}</figcaption>
            <svg viewBox="0 0 100 40" preserveAspectRatio="none" className={styles.svg} aria-hidden="true">
                {data.map((d, i) => {
                    const h = (d.value / max) * 38;
                    return <rect key={d.label} x={i * w + w * 0.15} y={40 - h} width={w * 0.7} height={Math.max(h, d.value > 0 ? 0.6 : 0)} rx={0.6} className={styles.bar} />;
                })}
            </svg>
            <div className={styles.axis} aria-hidden="true">
                <span>{data[0]?.label}</span>
                <span>{data[data.length - 1]?.label}</span>
            </div>
            <table className="visually-hidden">
                <caption>{title}</caption>
                <tbody>
                    {data.map((d) => (
                        <tr key={d.label}><th scope="row">{d.label}</th><td>{d.display}</td></tr>
                    ))}
                </tbody>
            </table>
        </figure>
    );
}
