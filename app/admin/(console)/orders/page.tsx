import type { Metadata } from "next";
import { Suspense } from "react";
import { BrandSpinner } from "@/components/ui/ProgressOverlay";
import { OrdersClient } from "./OrdersClient";

export const metadata: Metadata = { title: "Orders — Storefronts admin" };

export default function AdminOrdersPage(): React.JSX.Element {
    return (
        <Suspense fallback={<BrandSpinner mode="content" message="Loading orders…" />}>
            <OrdersClient />
        </Suspense>
    );
}
