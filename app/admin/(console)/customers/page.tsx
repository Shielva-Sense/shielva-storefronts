import type { Metadata } from "next";
import { Suspense } from "react";
import { BrandSpinner } from "@/components/ui/ProgressOverlay";
import { CustomersClient } from "./CustomersClient";

export const metadata: Metadata = { title: "Customers — Storefronts admin" };

export default function AdminCustomersPage(): React.JSX.Element {
    return (
        <Suspense fallback={<BrandSpinner mode="content" message="Loading customers…" />}>
            <CustomersClient />
        </Suspense>
    );
}
