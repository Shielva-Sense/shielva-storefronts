"use client";

import { useCallback, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { MoveHorizontal } from "lucide-react";
import styles from "./BeforeAfter.module.scss";

const STEP = 5;

/** Drag / arrow-key comparison slider (ARIA slider pattern). */
export function BeforeAfter({ label }: { label: string }): React.JSX.Element {
    const [pos, setPos] = useState(50);
    const frame = useRef<HTMLDivElement>(null);
    const dragging = useRef(false);

    const setFromPointer = useCallback((clientX: number) => {
        const rect = frame.current?.getBoundingClientRect();
        if (!rect) return;
        setPos(Math.round(Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100))));
    }, []);

    const onPointerDown = (e: PointerEvent<HTMLDivElement>): void => {
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        setFromPointer(e.clientX);
    };
    const onPointerMove = (e: PointerEvent<HTMLDivElement>): void => {
        if (dragging.current) setFromPointer(e.clientX);
    };
    const onPointerUp = (): void => {
        dragging.current = false;
    };
    const onKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
        const map: Record<string, number> = { ArrowLeft: pos - STEP, ArrowRight: pos + STEP, Home: 0, End: 100 };
        const next = map[e.key];
        if (next === undefined) return;
        e.preventDefault();
        setPos(Math.min(100, Math.max(0, next)));
    };

    return (
        <div
            ref={frame}
            className={styles.frame}
            style={{ "--pos": pos } as React.CSSProperties}
            role="slider"
            tabIndex={0}
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pos}
            aria-valuetext={`${pos}% after`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onKeyDown={onKeyDown}
        >
            <div className={styles.before} aria-hidden="true"><span className={styles.tag}>Before</span></div>
            <div className={styles.after} aria-hidden="true"><span className={styles.tag}>After</span></div>
            <div className={styles.handle} aria-hidden="true">
                <span><MoveHorizontal size={15} /></span>
            </div>
        </div>
    );
}
