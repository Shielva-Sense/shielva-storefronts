import { hostForStore } from "./brand-hosts";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3030";

export const ROUTES = {
    playbook: "/",
    beauty: "/beauty",
    salon: "/salon",
    fashion: "/fashion",
} as const;

/**
 * Public URL of a path. Store paths resolve to their brand domain when one is configured
 * ("/beauty/journal" → https://velour.shielva.ai/journal), so canonicals and sitemaps point
 * at the address shoppers actually use.
 */
export function absoluteUrl(path: string): string {
    const match = /^\/([a-z]+)(?=[/#?]|$)(.*)$/.exec(path);
    const host = match?.[1] ? hostForStore(match[1]) : null;
    if (host) {
        const rest = match?.[2] ?? "";
        return new URL(rest.startsWith("/") ? rest : `/${rest}`, `https://${host}`).toString();
    }
    return new URL(path, SITE_URL).toString();
}
