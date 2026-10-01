import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { ProgressOverlay } from "@/components/ui/ProgressOverlay";
import { AdminShell } from "@/features/admin-session/AdminShell";

export const metadata: Metadata = { title: "Storefronts admin", robots: { index: false, follow: false } };

export default function ConsoleLayout({ children }: { children: ReactNode }): React.JSX.Element {
    return (
        <Suspense fallback={<ProgressOverlay open message="Opening the console…" />}>
            <AdminShell>{children}</AdminShell>
        </Suspense>
    );
}
