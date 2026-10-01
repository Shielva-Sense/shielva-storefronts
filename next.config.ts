import type { NextConfig } from "next";
import { MEDIA_HOSTS } from "./app/features/storefront/constants";

/**
 * Security headers are applied here for `next dev` / `next start`.
 * If this app is ever exported statically, the upstream edge (Cloudflare /
 * ingress) MUST set the same headers — static export ignores `headers()`.
 */
const SECURITY_HEADERS = [
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    {
        key: "Content-Security-Policy",
        value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline'" + (process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""),
            "style-src 'self' 'unsafe-inline'",
            `img-src 'self' data: blob: ${MEDIA_HOSTS.map((h) => `https://${h}`).join(" ")}`,
            "font-src 'self'",
            "connect-src 'self'" + (process.env.NODE_ENV === "development" ? " ws:" : ""),
            "frame-ancestors 'none'",
        ].join("; "),
    },
];

const API_ORIGIN = process.env.API_ORIGIN ?? "http://127.0.0.1:8040";

const nextConfig: NextConfig = {
    // E2E runs a second dev server with its own build/cache dir (see playwright.config.ts).
    distDir: process.env.NEXT_DIST_DIR ?? ".next",
    poweredByHeader: false,
    /** Container image ships the minimal server (`node server.js`). */
    output: "standalone",
    /** Product photos come from Shopify's CDN (same host list the storefront checks before rendering). */
    images: { remotePatterns: MEDIA_HOSTS.map((hostname) => ({ protocol: "https" as const, hostname })) },
    /** Browser → same-origin /api/v1 → storefronts API. Keeps session cookies first-party (SameSite=Strict). */
    async rewrites() {
        return [{ source: "/api/v1/:path*", destination: `${API_ORIGIN}/api/v1/:path*` }];
    },
    async headers() {
        return [{ source: "/:path*", headers: SECURITY_HEADERS }];
    },
};

export default nextConfig;
