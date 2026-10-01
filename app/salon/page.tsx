import type { Metadata } from "next";
import { JsonLd } from "@/components/ui/JsonLd";
import { serverFetch } from "@/core/server-api";
import { SalonStorefront } from "@/features/salon/components/SalonStorefront";
import { SALON_BRAND, SALON_FALLBACK_SECTIONS } from "@/features/salon/constants";
import { salonVisit } from "@/features/salon/content";
import { faqSchema, salonSchema } from "@/features/salon/schema";
import type { BookingCatalog } from "@/features/salon/types";
import { loadPage, loadStorefront } from "@/features/storefront/server";
import { breadcrumbSchema, pageMetadata } from "@/core/seo";
import { ROUTES } from "@/core/site";

const FALLBACK_META = {
    title: "Maison Noor — Hair Salon in SoHo, New York | Book Online",
    description: "Senior-stylist haircuts, balayage and keratin in SoHo, New York. Transparent prices, online booking in under a minute, rated 4.9 from 1,286 Google reviews.",
};

export async function generateMetadata(): Promise<Metadata> {
    const page = await loadPage("salon");
    return pageMetadata({
        title: page?.seo.title ?? FALLBACK_META.title,
        description: page?.seo.description ?? FALLBACK_META.description,
        path: page?.seo.canonicalPath ?? ROUTES.salon,
        keywords: ["hair salon SoHo", "balayage NYC", "best haircut Manhattan", "keratin treatment New York", "salon near me"],
    });
}

export default async function SalonPage(): Promise<React.JSX.Element> {
    const [data, booking] = await Promise.all([loadStorefront("salon", SALON_FALLBACK_SECTIONS), serverFetch<BookingCatalog>("/bookings/services", "salon", 60)]);
    const schema = data.page?.seo.schema ?? { product: false, breadcrumb: true, faq: true, localBusiness: true };
    const rating = data.reviews && data.reviews.count > 0 ? { average: data.reviews.average, count: data.reviews.count } : undefined;
    const visit = salonVisit(data.sections.find((s) => s.type === "salon.visit"));
    return (
        <>
            {schema.localBusiness ? <JsonLd data={salonSchema(booking?.services ?? [], rating, visit)} /> : null}
            {schema.faq ? <JsonLd data={faqSchema(visit.faq)} /> : null}
            {schema.breadcrumb ? <JsonLd data={breadcrumbSchema([{ name: "Storefronts", path: ROUTES.playbook }, { name: SALON_BRAND, path: ROUTES.salon }])} /> : null}
            <SalonStorefront data={data} booking={booking} />
        </>
    );
}
