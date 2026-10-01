"use client";

import { useEffect } from "react";
import { trackEvent } from "./api";
import type { StoreSlug } from "./types";

export function PageViewBeacon({ store }: { store: StoreSlug }): null {
    useEffect(() => {
        void trackEvent(store, "page_view");
    }, [store]);
    return null;
}

/** Reports which A/B arm this visitor saw (once per page load). */
export function ExperimentBeacon({ store, sectionId, variant }: { store: StoreSlug; sectionId: string; variant: "A" | "B" }): null {
    useEffect(() => {
        void trackEvent(store, "variant_exposure", { sectionId, variant });
    }, [store, sectionId, variant]);
    return null;
}
