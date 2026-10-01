import type { Metadata } from "next";
import { Suspense } from "react";
import { BrandSpinner } from "@/components/ui/ProgressOverlay";
import { ThemeClient } from "./ThemeClient";

export const metadata: Metadata = { title: "Theme — Storefronts admin" };

export default function AdminThemePage(): React.JSX.Element {
    return (
        <Suspense fallback={<BrandSpinner mode="content" message="Loading theme tokens…" />}>
            <ThemeClient />
        </Suspense>
    );
}
