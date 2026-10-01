import { MOTION_QUERIES } from "./scroll-engine";

/**
 * Runs in <head> before first paint so reveal elements start hidden only when
 * JS is actually available (no-JS / crawlers without JS see all content), and
 * so pinned layouts never flash on mobile. Static string — no user input.
 */
export const MOTION_BOOT_SCRIPT = `(function(){try{var m=window.matchMedia;var d=document.documentElement;d.dataset.motion=m(${JSON.stringify(
    MOTION_QUERIES.reduced,
)}).matches?"reduced":m(${JSON.stringify(MOTION_QUERIES.lite)}).matches?"lite":"full";}catch(e){}})();`;
