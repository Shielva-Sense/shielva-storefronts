/**
 * Embedded-preview support (a portfolio frames the live stores; framing is allowed only for the
 * origins in FRAME_ANCESTORS). Shopify's hosted checkout refuses to be framed, so navigation that
 * leaves the store opens a new tab when framed.
 */

export const FRAME_READY_MESSAGE = "shielva:storefront-ready";

export function isFramed(): boolean {
    try {
        return window.self !== window.top;
    } catch {
        return true; // cross-origin top: reading window.top threw, so we are framed
    }
}

/** Navigate to an external page (Shopify checkout) — new tab when framed, same tab otherwise. */
export function openOutsideFrame(url: string): void {
    if (isFramed()) window.open(url, "_blank", "noopener");
    else window.location.assign(url);
}

/** Tells the embedding page the store has rendered, so it can swap its poster for the live frame. */
export function announceFrameReady(): void {
    if (isFramed()) window.parent.postMessage({ type: FRAME_READY_MESSAGE }, "*"); // no data, only a signal
}
