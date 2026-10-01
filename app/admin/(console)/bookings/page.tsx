import type { Metadata } from "next";
import { Suspense } from "react";
import { BrandSpinner } from "@/components/ui/ProgressOverlay";
import { BookingsClient } from "./BookingsClient";

export const metadata: Metadata = { title: "Bookings — Storefronts admin" };

export default function AdminBookingsPage(): React.JSX.Element {
    return (
        <Suspense fallback={<BrandSpinner mode="content" message="Loading bookings…" />}>
            <BookingsClient />
        </Suspense>
    );
}
