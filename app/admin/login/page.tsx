import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginClient } from "./LoginClient";

export const metadata: Metadata = { title: "Sign in — Storefronts admin", robots: { index: false, follow: false } };

export default function AdminLoginPage(): React.JSX.Element {
    return (
        <Suspense>
            <LoginClient />
        </Suspense>
    );
}
