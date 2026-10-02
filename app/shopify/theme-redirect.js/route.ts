import { absoluteUrl } from "@/core/site";

const STORES = new Set(["beauty", "salon", "fashion"]);
/** Shopify pages that must keep working on the shop's own domain (dev-store password, cart → checkout). */
const KEEP = /^\/(password|checkouts|cart|admin|apps|tools|services)(\/|$)/;

/**
 * Loaded by a Shopify script tag (installed by `shopify:connect`) on the store's Online Store theme.
 * The storefront is headless, so anyone landing on the theme — e.g. checkout's "Continue shopping"
 * — is sent to the brand site. Never runs in the theme editor or on Shopify's own flows.
 */
export function GET(request: Request): Response {
    const store = new URL(request.url).searchParams.get("store") ?? "";
    if (!STORES.has(store)) return new Response("/* unknown store */", { status: 404, headers: { "content-type": "application/javascript; charset=utf-8" } });
    const home = absoluteUrl(`/${store}`).replace(/\/$/, "");
    const js = `(function(){var S=window.Shopify;if(S&&S.designMode)return;var p=location.pathname;if(${KEEP.toString()}.test(p))return;location.replace(${JSON.stringify(home)}+(p.indexOf("/account")===0?"/account":"/"));})();`;
    return new Response(js, { headers: { "content-type": "application/javascript; charset=utf-8", "cache-control": "public, max-age=300" } });
}
