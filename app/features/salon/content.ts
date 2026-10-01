import { prop } from "@/components/sections/SharedSections";
import type { ResolvedSection } from "@/features/storefront/types";
import { SALON_FAQ, SALON_LOCATION } from "./constants";

export interface SalonVisitContent {
    street: string;
    city: string;
    postalCode: string;
    phone: string;
    faq: { q: string; a: string }[];
}

/** Visit-section business details (editable in place); the page's JSON-LD reads the same values. */
export function salonVisit(section: ResolvedSection | undefined): SalonVisitContent {
    const get = (key: string, fallback: string): string => (section ? prop(section, key, fallback) : fallback);
    return {
        street: get("street", SALON_LOCATION.street),
        city: get("city", SALON_LOCATION.city),
        postalCode: get("postalCode", SALON_LOCATION.postalCode),
        phone: get("phone", SALON_LOCATION.phone),
        faq: SALON_FAQ.map((f, i) => ({ q: get(`faq${i + 1}Q`, f.q), a: get(`faq${i + 1}A`, f.a) })),
    };
}
