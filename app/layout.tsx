import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { inter } from "@/core/fonts";
import { MOTION_BOOT_SCRIPT } from "@/core/motion/boot-script";
import { SITE_URL } from "@/core/site";
import { Providers } from "@/components/Providers";
import "./globals.scss";

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: { default: "Shielva Storefronts — ICP-led commerce design", template: "%s" },
    description: "Three storefronts, three buyers: how page design changes by ideal customer profile for beauty, salon and fashion brands.",
    robots: { index: true, follow: true },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    themeColor: "#16130f",
};

export default function RootLayout({ children }: { children: ReactNode }): React.JSX.Element {
    return (
        <html lang="en" className={inter.variable} suppressHydrationWarning>
            <head>
                {/* Static boot string (no user input): sets html[data-motion] before first paint. */}
                <script dangerouslySetInnerHTML={{ __html: MOTION_BOOT_SCRIPT }} />
            </head>
            <body>
                <a href="#main-content" className="skip-link">Skip to main content</a>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
