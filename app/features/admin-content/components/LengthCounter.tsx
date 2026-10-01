import { StatusBadge } from "@/components/ui/StatusBadge";
import { lengthTone } from "../constants";
import styles from "./Content.module.scss";

interface LengthCounterProps {
    id: string;
    length: number;
    min: number;
    max: number;
}

/** Live character counter; warns (text + tone, never colour alone) outside the recommended window. */
export function LengthCounter({ id, length, min, max }: LengthCounterProps): React.JSX.Element {
    const tone = lengthTone(length, min, max);
    const note = length === 0 ? `Aim for ${min}–${max} characters` : length < min ? `Too short — aim for ${min}–${max}` : length > max ? `Too long — search engines truncate after ${max}` : "Good length";
    return (
        <p id={id} className={styles.counter}>
            <StatusBadge tone={tone}>{length} / {max}</StatusBadge>
            <span>{note}</span>
        </p>
    );
}
