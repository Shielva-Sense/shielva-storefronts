import type { Metadata } from "next";
import { Suspense } from "react";
import { ProgressOverlay } from "@/components/ui/ProgressOverlay";
import { AccountClient } from "@/features/account/components/AccountClient";
import { serverFetch } from "@/core/server-api";
import { StoreShell } from "@/features/storefront/shell";

export const metadata: Metadata = { title: "Your account", robots: { index: false, follow: false } };

export default async function AccountPage(): Promise<React.JSX.Element> {
    const theme = await serverFetch<{ tokens: Record<string, string> }>("/theme", "salon");
    return (
        <StoreShell store="salon" {...(theme ? { theme: theme.tokens } : {})}>
            <Suspense fallback={<ProgressOverlay open message="Opening your account…" />}>
                <AccountClient store="salon" />
            </Suspense>
        </StoreShell>
    );
}
