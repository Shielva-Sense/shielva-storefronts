import type { Metadata } from "next";
import { Suspense } from "react";
import { BrandSpinner } from "@/components/ui/ProgressOverlay";
import { ReviewsClient } from "./ReviewsClient";

export const metadata: Metadata = { title: "Reviews — Storefronts admin" };

export default function AdminReviewsPage(): React.JSX.Element {
    return (
        <Suspense fallback={<BrandSpinner mode="content" message="Loading reviews…" />}>
            <ReviewsClient />
        </Suspense>
    );
}
