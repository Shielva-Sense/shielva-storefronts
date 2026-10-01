import type { Metadata } from "next";
import { Suspense } from "react";
import { BrandSpinner } from "@/components/ui/ProgressOverlay";
import { ReturnsClient } from "./ReturnsClient";

export const metadata: Metadata = { title: "Returns — Storefronts admin" };

export default function AdminReturnsPage(): React.JSX.Element {
    return (
        <Suspense fallback={<BrandSpinner mode="content" message="Loading returns…" />}>
            <ReturnsClient />
        </Suspense>
    );
}
