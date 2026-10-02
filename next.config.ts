import type { NextConfig } from "next";
import { MEDIA_HOSTS } from "./app/features/storefront/constants";

/**
 * Security headers are applied here for `next dev` / `next start`.
 * If this app is ever exported statically, the upstream edge (Cloudflare /
 * ingress) MUST set the same headers — static export ignores `headers()`.
 */
/**
 * Who may frame the storefronts (the portfolio's live "theme preview"), e.g. "https://me.shielva.ai".
 * Build-time: next.config headers are baked into the standalone build. Unset = nobody.
 * The admin console is never frameable (ADMIN_HEADERS below).
 */
const FRAME_ANCESTORS = (process.env.FRAME_ANCESTORS ?? "").split(/[\s,]+/).filter((o) => /^https:\/\/[a-z0-9.-]+$/i.test(o));

const SECURITY_HEADERS = [
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
            FRAME_ANCESTORS.length > 0 ? `frame-ancestors 'self' ${FRAME_ANCESTORS.join(" ")}` : "frame-ancestors 'none'",
        ].join("; "),
    },
    // X-Frame-Options can't allow-list another origin; send DENY only when nobody may frame.
    ...(FRAME_ANCESTORS.length > 0 ? [] : [{ key: "X-Frame-Options", value: "DENY" }]),
];

/** Admin hosts from ADMIN_HOSTS ("host[:port],…") — matched on hostname. Build-time, like FRAME_ANCESTORS. */
const ADMIN_HOSTNAMES = (process.env.ADMIN_HOSTS ?? "").split(",").map((h) => h.trim().split(":")[0] ?? "").filter(Boolean);

/** Admin + editor: never framed, whatever FRAME_ANCESTORS says (same key → later rule wins). */
const ADMIN_HEADERS = [
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Content-Security-Policy", value: (SECURITY_HEADERS.find((h) => h.key === "Content-Security-Policy")?.value ?? "").replace(/frame-ancestors [^;]+/, "frame-ancestors 'none'") },
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
        return [
            { source: "/:path*", headers: SECURITY_HEADERS },
            { source: "/admin/:path*", headers: ADMIN_HEADERS },
            { source: "/admin", headers: ADMIN_HEADERS },
            // Everything on the admin host (incl. the in-place editor on storefront paths).
            ...ADMIN_HOSTNAMES.map((value) => ({ source: "/:path*", has: [{ type: "host" as const, value }], headers: ADMIN_HEADERS })),
        ];
    },
};

export default nextConfig;
