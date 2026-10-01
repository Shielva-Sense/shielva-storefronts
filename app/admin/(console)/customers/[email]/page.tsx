import type { Metadata } from "next";
import { Suspense } from "react";
import { BrandSpinner } from "@/components/ui/ProgressOverlay";
import { CustomerDetailClient } from "./CustomerDetailClient";

export const metadata: Metadata = { title: "Customer — Storefronts admin" };

function safeDecode(value: string): string {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

export default async function AdminCustomerPage({ params }: { params: Promise<{ email: string }> }): Promise<React.JSX.Element> {
    const { email } = await params;
    return (
        <Suspense fallback={<BrandSpinner mode="content" message="Loading the customer…" />}>
            <CustomerDetailClient email={safeDecode(email).toLowerCase()} />
        </Suspense>
    );
}
