import type { Metadata } from "next";
import { Suspense } from "react";
import { BrandSpinner } from "@/components/ui/ProgressOverlay";
import { OrderDetailClient } from "./OrderDetailClient";

export const metadata: Metadata = { title: "Order — Storefronts admin" };

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }): Promise<React.JSX.Element> {
    const { id } = await params;
    return (
        <Suspense fallback={<BrandSpinner mode="content" message="Loading the order…" />}>
            <OrderDetailClient id={id} />
        </Suspense>
    );
}
