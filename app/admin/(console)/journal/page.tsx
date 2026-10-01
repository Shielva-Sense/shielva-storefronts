import type { Metadata } from "next";
import { Suspense } from "react";
import { BrandSpinner } from "@/components/ui/ProgressOverlay";
import { JournalClient } from "./JournalClient";

export const metadata: Metadata = { title: "Journal & SEO — Storefronts admin" };

export default function AdminJournalPage(): React.JSX.Element {
    return (
        <Suspense fallback={<BrandSpinner mode="content" message="Loading the journal…" />}>
            <JournalClient />
        </Suspense>
    );
}
