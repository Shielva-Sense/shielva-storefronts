import type { Metadata } from "next";
import { Suspense } from "react";
import { BrandSpinner } from "@/components/ui/ProgressOverlay";
import { AuditClient } from "./AuditClient";

export const metadata: Metadata = { title: "Audit log — Storefronts admin" };

export default function AdminAuditPage(): React.JSX.Element {
    return (
        <Suspense fallback={<BrandSpinner mode="content" message="Loading the audit log…" />}>
            <AuditClient />
        </Suspense>
    );
}
