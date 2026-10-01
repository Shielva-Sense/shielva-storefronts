"use client";

import { useEffect } from "react";
import { MOTION_QUERIES, ScrollEngine } from "@/core/motion/scroll-engine";

/**
 * Boots one ScrollEngine per storefront. Restarts when the device class
 * changes (rotate a tablet, resize past the breakpoint, toggle reduced motion)
 * so the page swaps between pinned and stacked layouts live.
 */
export function MotionProvider(): null {
    useEffect(() => {
        let engine = new ScrollEngine();
        engine.start(document.body);

        const queries = Object.values(MOTION_QUERIES).map((q) => window.matchMedia(q));
        const restart = (): void => {
            engine.stop();
            engine = new ScrollEngine();
            engine.start(document.body);
        };
        queries.forEach((q) => q.addEventListener("change", restart));

        return () => {
            queries.forEach((q) => q.removeEventListener("change", restart));
            engine.stop();
        };
    }, []);

    return null;
}
