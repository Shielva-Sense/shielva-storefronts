import type { Metadata } from "next";
import { Suspense } from "react";
import { BrandSpinner } from "@/components/ui/ProgressOverlay";
import { CatalogClient } from "./CatalogClient";

export const metadata: Metadata = { title: "Catalogue — Storefronts admin" };

export default function AdminCatalogPage(): React.JSX.Element {
    return (
        <Suspense fallback={<BrandSpinner mode="content" message="Loading the catalogue…" />}>
            <CatalogClient />
        </Suspense>
    );
}
