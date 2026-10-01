import { CURRENCY_CODE } from "@/core/formatters";
import { absoluteUrl, ROUTES } from "@/core/site";
import { SALON_BRAND, SALON_HOURS, SALON_LOCATION, SALON_RATING, SALON_SERVICES } from "./constants";
import { salonVisit, type SalonVisitContent } from "./content";
import type { BookableService } from "./types";

/** HairSalon (LocalBusiness) — powers the map pack / "near me" results. */
export function salonSchema(live: readonly BookableService[] = [], rating: { average: number; count: number } = SALON_RATING, visit: SalonVisitContent = salonVisit(undefined)): Record<string, unknown> {
    const services = live.length > 0 ? live.map((s) => ({ name: s.name, description: s.description, from: s.priceCents / 100 })) : SALON_SERVICES;
    return {
        "@context": "https://schema.org",
        "@type": "HairSalon",
        name: SALON_BRAND,
        url: absoluteUrl(ROUTES.salon),
        telephone: visit.phone,
        priceRange: "$$",
        address: {
            "@type": "PostalAddress",
            streetAddress: visit.street,
            addressLocality: visit.city,
            addressRegion: SALON_LOCATION.region,
            postalCode: visit.postalCode,
            addressCountry: SALON_LOCATION.country,
        },
        geo: { "@type": "GeoCoordinates", latitude: SALON_LOCATION.lat, longitude: SALON_LOCATION.lng },
        openingHoursSpecification: SALON_HOURS.filter((h) => h.open).map((h) => ({
            "@type": "OpeningHoursSpecification",
            dayOfWeek: h.schemaDays,
            opens: h.open,
            closes: h.close,
        })),
        aggregateRating: { "@type": "AggregateRating", ratingValue: rating.average, reviewCount: rating.count },
        hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: "Services",
            itemListElement: services.map((s) => ({
                "@type": "Offer",
                itemOffered: { "@type": "Service", name: s.name, description: s.description },
                priceSpecification: { "@type": "PriceSpecification", minPrice: s.from, priceCurrency: CURRENCY_CODE },
            })),
        },
        potentialAction: { "@type": "ReserveAction", target: absoluteUrl(`${ROUTES.salon}#book`) },
    };
}

export function faqSchema(faq: SalonVisitContent["faq"] = salonVisit(undefined).faq): Record<string, unknown> {
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    };
}
