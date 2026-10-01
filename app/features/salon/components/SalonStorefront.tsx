import type { CSSProperties } from "react";
import { MapPin, Phone } from "lucide-react";
import { StorefrontLayout } from "@/components/layouts/StorefrontLayout";
import { SplitText } from "@/components/motion/SplitText";
import { AddToBag } from "@/components/ui/AddToBag";
import { ButtonLink } from "@/components/ui/Button";
import { StarRating } from "@/components/ui/StarRating";
import { cormorant } from "@/core/fonts";
import { formatNumber, formatPrice } from "@/core/formatters";
import { AnnouncementSection, CollectionCopy, EditableTemplate, EditableText, JournalTeaser, listProp, prop, SectionFrame } from "@/components/sections/SharedSections";
import { editAttrs, listItemAttrs, priceAttrs, siteEditAttrs } from "@/features/inline-edit/markers";
import { priceFrom } from "@/features/storefront/catalog";
import type { ResolvedSection, StorefrontData } from "@/features/storefront/types";
import { InlineEditorLoader } from "@/features/inline-edit/components/InlineEditorLoader";
import { storefrontChrome } from "@/features/storefront/chrome";
import type { BookingCatalog } from "../types";
import { TeamList } from "./TeamList";
import {
    SALON_BRAND,
    SALON_FAQ,
    SALON_FREE_SHIPPING_AT,
    SALON_HOURS,
    SALON_LOCATION,
    SALON_MEMBERSHIP,
    SALON_PROCESS,
    SALON_RATING,
    SALON_REVIEWS,
    SALON_SECTION_DEFAULTS,
} from "../constants";
import { SalonBookingProvider } from "../SalonBookingContext";
import { BeforeAfter } from "./BeforeAfter";
import { BookingWidget } from "./BookingWidget";
import { ServiceMenu } from "./ServiceMenu";
import styles from "./Salon.module.scss";

const HAIR_STRANDS = [
    "M40 20 C 120 140, 20 260, 110 380 S 90 560, 150 640",
    "M80 10 C 160 150, 60 270, 150 390 S 140 560, 190 640",
    "M120 0 C 200 140, 110 280, 190 400 S 190 560, 230 640",
    "M160 0 C 240 160, 160 290, 230 410 S 240 560, 270 640",
    "M200 10 C 270 170, 210 300, 270 420 S 290 560, 310 640",
] as const;

const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SALON_LOCATION.mapsQuery)}`;

export function SalonStorefront({ data, booking }: { data: StorefrontData; booking: BookingCatalog | null }): React.JSX.Element {
    const membershipPrice = priceFrom(data.catalog, SALON_MEMBERSHIP.id, SALON_MEMBERSHIP.price);
    const rating = data.reviews && data.reviews.count > 0 ? { average: data.reviews.average, count: data.reviews.count } : SALON_RATING;
    const quotes = data.reviews && data.reviews.count > 0 ? data.reviews.items.slice(0, 3).map((r) => ({ id: r.id, author: r.authorName, body: r.body, meta: r.verified ? "Verified client" : "Client" })) : SALON_REVIEWS;
    const d = SALON_SECTION_DEFAULTS;

    const render = (section: ResolvedSection): React.ReactNode => {
        switch (section.type) {
            case "salon.hero":
                return (
                    <section className={styles.hero} aria-labelledby="salon-hero-title">
                        <div className={`container ${styles.heroGrid}`}>
                            <div className={styles.heroCopy}>
                                <p className="eyebrow" data-reveal="fade"><EditableText section={section} field="eyebrow" fallback={d.hero.eyebrow} /></p>
                                <h1 id="salon-hero-title" className={`display ${styles.heroTitle}`}>
                                    <SplitText text={prop(section, "title", d.hero.title)} edit={editAttrs(section, "title", prop(section, "title", d.hero.title))} />
                                </h1>
                                <p className={styles.lede} data-reveal="rise" style={{ "--i": 2 } as CSSProperties}><EditableText section={section} field="lede" fallback={d.hero.lede} /></p>
                                <div data-reveal="rise" style={{ "--i": 3 } as CSSProperties}>
                                    <BookingWidget initial={booking} />
                                </div>
                            </div>
                            <div className={styles.heroArt} data-scroll="through" aria-hidden="true">
                                <div className={styles.archWrap} data-reveal="mask">
                                    <div className={styles.arch}>
                                        <svg viewBox="0 0 320 640" preserveAspectRatio="xMidYMid slice" className={styles.strands}>
                                            {HAIR_STRANDS.map((path, i) => (
                                                <path key={path} d={path} style={{ "--i": i } as CSSProperties} />
                                            ))}
                                        </svg>
                                    </div>
                                </div>
                                <div className={styles.ratingChip} data-reveal="scale" style={{ "--i": 5 } as CSSProperties}>
                                    <StarRating value={rating.average} />
                                    <span><EditableTemplate section={section} field="ratingLabel" fallback="{count} reviews" values={{ count: formatNumber(rating.count) }} /></span>
                                </div>
                            </div>
                        </div>
                    </section>
                );
            case "salon.trust":
                return (
                    <section className={styles.trust} aria-label="Why clients choose us">
                        <ul className="container">
                            {listProp(section, "items", d.trust).map((t, i, all) => (
                                <li key={t} data-reveal="fade" style={{ "--i": i } as CSSProperties}><span {...listItemAttrs(section, "items", all, i)}>{t}</span></li>
                            ))}
                        </ul>
                    </section>
                );
            case "salon.services":
                return (
                    <section id="services" className="section" aria-labelledby="services-title">
                        <div className={`container ${styles.servicesGrid}`}>
                            <div className={styles.servicesIntro}>
                                <p className="eyebrow" data-reveal="fade"><EditableText section={section} field="eyebrow" fallback={d.services.eyebrow} /></p>
                                <SplitText as="h2" text={prop(section, "title", d.services.title)} edit={editAttrs(section, "title", prop(section, "title", d.services.title))} className={`display ${styles.h2}`} />
                                <p className="text-muted" data-reveal="rise"><EditableText section={section} field="lede" fallback={d.services.lede} /></p>
                            </div>
                            <div data-reveal="rise"><ServiceMenu initial={booking} /></div>
                        </div>
                    </section>
                );
            case "salon.process":
                return (
                    <section className={styles.process} data-scroll="pin" aria-labelledby="process-title">
                        <div className={styles.processStage}>
                            <div className="container">
                                <h2 id="process-title" className={`eyebrow ${styles.processEyebrow}`}><EditableText section={section} field="title" fallback={d.process.title} /></h2>
                                <ol className={styles.steps}>
                                    {SALON_PROCESS.map((step, i) => (
                                        <li key={step.title} className={styles.step} style={{ "--i": i } as CSSProperties}>
                                            <span className={styles.stepNum}>0{i + 1}</span>
                                            <h3 className={`display ${styles.stepTitle}`}><EditableText section={section} field={`step${i + 1}Title`} fallback={step.title} /></h3>
                                            <p className={styles.stepBody}><EditableText section={section} field={`step${i + 1}Body`} fallback={step.body} /></p>
                                        </li>
                                    ))}
                                </ol>
                                <span className={styles.processBar} aria-hidden="true"><span /></span>
                            </div>
                        </div>
                    </section>
                );
            case "salon.team":
                return (
                    <section id="stylists" className="section" aria-labelledby="stylists-title">
                        <div className={`container ${styles.proofGrid}`}>
                            <div className={styles.compare} data-reveal="mask">
                                <BeforeAfter label="Before and after: balayage by Noor Rahman" />
                                <p className={styles.caption}><EditableTemplate section={section} field="caption" fallback="Balayage by Noor · 3h · from {price}" values={{ price: formatPrice((booking?.services.find((s) => s.handle === "balayage")?.priceCents ?? 32500) / 100) }} /></p>
                            </div>
                            <div className="stack">
                                <p className="eyebrow" data-reveal="fade"><EditableText section={section} field="eyebrow" fallback={d.team.eyebrow} /></p>
                                <SplitText as="h2" text={prop(section, "title", d.team.title)} edit={editAttrs(section, "title", prop(section, "title", d.team.title))} className={`display ${styles.h2}`} />
                                <TeamList initial={booking} />
                            </div>
                        </div>
                    </section>
                );
            case "salon.membership":
                return (
                    <section className={styles.membership} aria-labelledby="circle-title">
                        <div className={`container ${styles.circleGrid}`}>
                            <div className="stack">
                                <p className="eyebrow"><EditableText section={section} field="eyebrow" fallback={d.membership.eyebrow} /></p>
                                <SplitText as="h2" text={prop(section, "title", d.membership.title)} edit={editAttrs(section, "title", prop(section, "title", d.membership.title))} className={`display ${styles.h2}`} />
                                <p className={styles.circlePrice} data-reveal="rise"><span {...priceAttrs(section.editable, SALON_MEMBERSHIP.id, membershipPrice)}>{formatPrice(membershipPrice)}</span> <span><EditableText section={section} field="priceNote" fallback="/ month · cancel anytime" /></span></p>
                            </div>
                            <div className="stack" data-reveal="rise">
                                <ul className={styles.perks}>
                                    {listProp(section, "perks", SALON_MEMBERSHIP.perks).map((p, i, all) => <li key={p}><span {...listItemAttrs(section, "perks", all, i)}>{p}</span></li>)}
                                </ul>
                                <AddToBag sku={SALON_MEMBERSHIP.id} name={SALON_MEMBERSHIP.name} price={SALON_MEMBERSHIP.price} label={prop(section, "cta", "Join the Circle")} labelEdit={editAttrs(section, "cta", prop(section, "cta", "Join the Circle"))} size="lg" variantStyle="accent" />
                            </div>
                        </div>
                    </section>
                );
            case "salon.reviews":
                return (
                    <section className="section" aria-labelledby="salon-reviews-title">
                        <div className="container stack">
                            <div className="row row-between row-wrap">
                                <SplitText as="h2" text={prop(section, "title", d.reviews.title)} edit={editAttrs(section, "title", prop(section, "title", d.reviews.title))} className={`display ${styles.h2}`} />
                                <StarRating value={rating.average} count={rating.count} />
                            </div>
                            <ul className={styles.quotes}>
                                {quotes.map((r, i) => (
                                    <li key={r.id} data-reveal="rise" style={{ "--i": i } as CSSProperties}>
                                        <blockquote>“{r.body}”</blockquote>
                                        <p className={styles.quoteMeta}>{r.author} · {r.meta}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>
                );
            case "salon.visit":
                return (
                    <section id="visit" className={`section ${styles.visit}`} aria-labelledby="visit-title">
                        <div className={`container ${styles.visitGrid}`}>
                            <div className="stack">
                                <p className="eyebrow"><EditableText section={section} field="eyebrow" fallback="Visit" /></p>
                                <h2 id="visit-title" className={`display ${styles.h2}`}><EditableText section={section} field="title" fallback={d.visit.title} /></h2>
                                <address className={styles.address}>
                                    <MapPin size={16} aria-hidden="true" /> <EditableText section={section} field="street" fallback={SALON_LOCATION.street} />, <EditableText section={section} field="city" fallback={SALON_LOCATION.city} /> <EditableText section={section} field="postalCode" fallback={SALON_LOCATION.postalCode} />
                                </address>
                                <p className={styles.address}><Phone size={16} aria-hidden="true" /> <EditableText section={section} field="phone" fallback={SALON_LOCATION.phone} /></p>
                                <dl className={styles.hours}>
                                    {SALON_HOURS.map((h) => (
                                        <div key={h.days}>
                                            <dt>{h.days}</dt>
                                            <dd>{h.open ? `${h.open} – ${h.close}` : "Closed"}</dd>
                                        </div>
                                    ))}
                                </dl>
                                <div className="row row-wrap">
                                    <ButtonLink href="#book"><EditableText section={section} field="cta" fallback="Book a visit" /></ButtonLink>
                                    <a className={styles.directions} href={mapsUrl} target="_blank" rel="noopener noreferrer"><EditableText section={section} field="directions" fallback="Get directions" /></a>
                                </div>
                            </div>
                            <div className="stack">
                                <h2 className={`display ${styles.faqTitle}`}><EditableText section={section} field="faqTitle" fallback="Good to know" /></h2>
                                {SALON_FAQ.map((f, i) => (
                                    <details key={f.q} className={styles.faq} open={section.editable || undefined}>
                                        <summary><EditableText section={section} field={`faq${i + 1}Q`} fallback={f.q} /></summary>
                                        <p><EditableText section={section} field={`faq${i + 1}A`} fallback={f.a} /></p>
                                    </details>
                                ))}
                            </div>
                        </div>
                    </section>
                );
            case "journal.teaser":
                return <JournalTeaser store="salon" title={prop(section, "title", "From the journal")} edit={editAttrs(section, "title", prop(section, "title", "From the journal"))} more={prop(section, "more", "All stories")} moreEdit={editAttrs(section, "more", prop(section, "more", "All stories"))} posts={data.posts} />;
            case "announcement":
                return <AnnouncementSection text={prop(section, "text", "")} edit={editAttrs(section, "text", prop(section, "text", ""))} />;
            default:
                return null;
        }
    };

    const chrome = storefrontChrome({ store: "salon", brand: SALON_BRAND, site: data.site, home: true, editor: data.editor });
    return (
        <StorefrontLayout
            overlay={data.editor ? <InlineEditorLoader store="salon" site={data.site} /> : null}
            theme="salon"
            fontClass={cormorant.variable}
            brand={SALON_BRAND}
            nav={chrome.nav}
            freeShippingAt={SALON_FREE_SHIPPING_AT}
            catalog={data.catalog}
            experiments={data.experiments}
            themeTokens={data.theme}
            headerAction={<span className={styles.headerBook}><ButtonLink href="#book" size="sm"><span {...siteEditAttrs(data.editor, "labels.headerCta", data.site.labels.headerCta)}>{data.site.labels.headerCta}</span></ButtonLink></span>}
            footer={chrome.footer}
        >
            <SalonBookingProvider>
                {data.sections.map((section) => (
                    <SectionFrame key={section.id} store="salon" section={section}>
                        {render(section)}
                    </SectionFrame>
                ))}
                <CollectionCopy title="About Maison Noor" text={data.page?.seo.collectionCopy ?? ""} />

                <a href="#book" className={styles.mobileCta} {...siteEditAttrs(data.editor, "labels.mobileCta", data.site.labels.mobileCta)}>{data.site.labels.mobileCta}</a>
            </SalonBookingProvider>
        </StorefrontLayout>
    );
}
