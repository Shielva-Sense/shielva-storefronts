import type { Metadata } from "next";
import { Suspense } from "react";
import { BrandSpinner } from "@/components/ui/ProgressOverlay";
import { DashboardClient } from "./DashboardClient";

export const metadata: Metadata = { title: "Dashboard — Storefronts admin" };

export default function AdminDashboardPage(): React.JSX.Element {
    return (
        <Suspense fallback={<BrandSpinner mode="content" message="Loading the dashboard…" />}>
            <DashboardClient />
        </Suspense>
    );
}
