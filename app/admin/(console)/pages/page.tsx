import type { Metadata } from "next";
import { Suspense } from "react";
import { BrandSpinner } from "@/components/ui/ProgressOverlay";
import { PagesClient } from "./PagesClient";

export const metadata: Metadata = { title: "Page builder — Storefronts admin" };

export default function AdminPagesPage(): React.JSX.Element {
    return (
        <Suspense fallback={<BrandSpinner mode="content" message="Loading the page builder…" />}>
            <PagesClient />
        </Suspense>
    );
}
