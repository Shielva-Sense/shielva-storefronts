import { NextResponse, type NextRequest } from "next/server";
import { isAdminHost } from "@/core/admin-host";
import { storeForHost } from "@/core/brand-hosts";

const ANON_COOKIE = "sf_aid";
const YEAR = 60 * 60 * 24 * 365;
/** Unmatched route → the app's not-found page (with a 404 status). */
const NOT_FOUND = "/__admin-only";
const STORE_PATH = /^\/(beauty|salon|fashion)(\/|$)/;

const isAdminPath = (path: string): boolean => path === "/admin" || path.startsWith("/admin/") || path.startsWith("/api/v1/admin");

/**
 * 1. Admin surfaces (console, admin API, editor) exist only on the admin host — public domains
 *    answer 404 for them. The admin host's root opens the console.
 * 2. Brand domains (BRAND_HOSTS) serve their store at the root: velour.shielva.ai/account is the
 *    /beauty/account page; a /beauty/… link on that domain redirects to the clean URL.
 * 3. A stable anonymous visitor id exists BEFORE the first server render, so A/B buckets
 *    chosen on the server match the ones reported by the client beacons.
 */
export function proxy(request: NextRequest): NextResponse {
    const { pathname, search } = request.nextUrl;
    const host = request.headers.get("host");
    const adminHost = isAdminHost(host);

    if (isAdminPath(pathname)) {
        return adminHost ? NextResponse.next() : NextResponse.rewrite(new URL(NOT_FOUND, request.url), { status: 404 });
    }
    if (pathname === "/" && adminHost) return NextResponse.redirect(new URL("/admin", request.url));

    const brandStore = adminHost ? null : storeForHost(host);
    if (brandStore && pathname.startsWith("/api/")) return NextResponse.next();
    if (brandStore && STORE_PATH.test(pathname)) {
        const own = pathname === `/${brandStore}` || pathname.startsWith(`/${brandStore}/`);
        if (own) return NextResponse.redirect(new URL(`${pathname.slice(brandStore.length + 1) || "/"}${search}`, request.url), 308);
    }

    const target = brandStore ? new URL(`/${brandStore}${pathname === "/" ? "" : pathname}${search}`, request.url) : null;
    const isStorePage = target !== null || STORE_PATH.test(pathname);
    if (!isStorePage || request.cookies.get(ANON_COOKIE)) return target ? NextResponse.rewrite(target) : NextResponse.next();

    const id = crypto.randomUUID().replace(/-/g, "");
    request.cookies.set(ANON_COOKIE, id); // visible to server components in this same request
    const init = { request: { headers: request.headers } };
    const response = target ? NextResponse.rewrite(target, init) : NextResponse.next(init);
    response.cookies.set(ANON_COOKIE, id, { httpOnly: true, sameSite: "lax", secure: request.nextUrl.protocol === "https:", path: "/", maxAge: YEAR });
    return response;
}

// Everything except Next's own assets and well-known files (brand domains must rewrite every page path).
export const config = { matcher: ["/((?!_next/|favicon.ico|icon|apple-icon|manifest.webmanifest|robots.txt|sitemap.xml).*)"] };
