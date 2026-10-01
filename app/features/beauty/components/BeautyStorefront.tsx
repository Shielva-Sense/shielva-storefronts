import type { CSSProperties } from "react";
import { StorefrontLayout } from "@/components/layouts/StorefrontLayout";
import { SplitText } from "@/components/motion/SplitText";
import { AddToBag } from "@/components/ui/AddToBag";
import { ButtonLink } from "@/components/ui/Button";
import { StarRating } from "@/components/ui/StarRating";
import { ProductPhoto } from "@/components/ui/ProductPhoto";
import { fraunces } from "@/core/fonts";
import { formatCompact, formatPrice } from "@/core/formatters";
import { AnnouncementSection, CollectionCopy, EditableTemplate, EditableText, JournalTeaser, MarqueeSection, prop, SectionFrame, templateProp } from "@/components/sections/SharedSections";
import { attributeAttrs, editAttrs, optionAttrs, photoAttrs, priceAttrs, productTitleAttrs, siteEditAttrs } from "@/features/inline-edit/markers";
import { priceFrom } from "@/features/storefront/catalog";
import type { ResolvedSection, StorefrontData } from "@/features/storefront/types";
import { InlineEditorLoader } from "@/features/inline-edit/components/InlineEditorLoader";
import { storefrontChrome } from "@/features/storefront/chrome";
import { beautyCatalog } from "../catalog";
import type { BeautyCatalog, LipShade } from "../types";
import {
    BEAUTY_BRAND,
    BEAUTY_FREE_SHIPPING_AT,
    BEAUTY_MARQUEE,
    BEAUTY_RATING,
    BEAUTY_REVIEWS,
    BEAUTY_VALUES,
    BEAUTY_SECTION_DEFAULTS,
} from "../constants";
import { BundleBuilder } from "./BundleBuilder";
import { ShadeFinder } from "./ShadeFinder";
import styles from "./Beauty.module.scss";

const ORBIT = ["--shade-coral-fever", "--shade-velvet-berry", "--shade-nude-rose"] as const;

export function BeautyStorefront({ data }: { data: StorefrontData }): React.JSX.Element {
    const reviews = data.reviews && data.reviews.count > 0 ? data.reviews : null;
    const rating = reviews ? { average: reviews.average, count: reviews.count, distribution: reviews.distribution } : BEAUTY_RATING;
    const catalog = beautyCatalog(data.products);
    const bundlePrice = priceFrom(data.catalog, "everyday-edit", catalog.bundle.price);

    const render = (section: ResolvedSection): React.ReactNode => {
        switch (section.type) {
            case "beauty.hero":
                return <HeroSection section={section} rating={rating} hero={catalog.hero} />;
            case "marquee":
                return <MarqueeSection section={section} fallback={BEAUTY_MARQUEE} label="Why VELOUR" />;
            case "beauty.shadeFinder":
                return <ShadeFinderSection section={section} shades={catalog.shades} />;
            case "beauty.shadeRail":
                return <ShadeRailSection section={section} data={data} shades={catalog.shades} />;
            case "beauty.values":
                return <ValuesSection section={section} />;
            case "beauty.bundle":
                return <BundleSection section={section} price={bundlePrice} bundle={catalog.bundle} />;
            case "beauty.reviews":
                return <ReviewsSection section={section} rating={rating} items={reviews ? reviews.items.map((r) => ({ id: r.id, author: r.authorName, rating: r.rating, body: r.body, meta: r.verified ? "Verified buyer" : "Customer" })) : BEAUTY_REVIEWS} />;
            case "journal.teaser":
                return <JournalTeaser store="beauty" title={prop(section, "title", "From the journal")} edit={editAttrs(section, "title", prop(section, "title", "From the journal"))} more={prop(section, "more", "All stories")} moreEdit={editAttrs(section, "more", prop(section, "more", "All stories"))} posts={data.posts} />;
            case "announcement":
                return <AnnouncementSection text={prop(section, "text", "")} edit={editAttrs(section, "text", prop(section, "text", ""))} />;
            default:
                return null;
        }
    };

    const chrome = storefrontChrome({ store: "beauty", brand: BEAUTY_BRAND, site: data.site, home: true, editor: data.editor });
    return (
        <StorefrontLayout
            overlay={data.editor ? <InlineEditorLoader store="beauty" site={data.site} /> : null}
            theme="beauty"
            fontClass={fraunces.variable}
            brand={BEAUTY_BRAND}
            nav={chrome.nav}
            freeShippingAt={BEAUTY_FREE_SHIPPING_AT}
            catalog={data.catalog}
            experiments={data.experiments}
            themeTokens={data.theme}
            footer={chrome.footer}
        >
            {data.sections.map((section) => (
                <SectionFrame key={section.id} store="beauty" section={section}>
                    {render(section)}
                </SectionFrame>
            ))}
            <CollectionCopy title="About VELOUR" text={data.page?.seo.collectionCopy ?? ""} />

            <a href="#shade-finder" className={styles.mobileCta} {...siteEditAttrs(data.editor, "labels.mobileCta", data.site.labels.mobileCta)}>{data.site.labels.mobileCta}</a>
        </StorefrontLayout>
    );
}

// ─────────────────────────── Sections (page-builder types) ───────────────────────────

interface Rating {
    average: number;
    count: number;
    distribution: readonly number[];
}

/** Title line 2: the first word is set in italic ("knows you." → <em>knows</em> you.). */
function splitFirst(text: string): [string, string] {
    const i = text.indexOf(" ");
    return i === -1 ? [text, ""] : [text.slice(0, i), text.slice(i)];
}

function HeroSection({ section, rating, hero }: { section: ResolvedSection; rating: Rating; hero: LipShade }): React.JSX.Element {
    const d = BEAUTY_SECTION_DEFAULTS.hero;
    const line2 = prop(section, "titleLine2", d.titleLine2);
    const [em, rest] = splitFirst(line2);
    return (
        <section className={styles.hero} data-scroll="pin" aria-labelledby="beauty-hero-title">
            <div className={styles.heroStage}>
                <div className={styles.wash} aria-hidden="true" />
                <div className={`container ${styles.heroGrid}`}>
                    <div className={styles.heroCopy}>
                        <p className="eyebrow" data-reveal="fade"><EditableText section={section} field="eyebrow" fallback={d.eyebrow} /></p>
                        <h1 id="beauty-hero-title" className={`display ${styles.heroTitle}`}>
                            <span className={styles.line1}><EditableText section={section} field="titleLine1" fallback={d.titleLine1} /></span>
                            <span className={styles.line2} {...editAttrs(section, "titleLine2", line2)}><em>{em}</em>{rest}</span>
                        </h1>
                        <p className={styles.lede} data-reveal="rise" style={{ "--i": 2 } as CSSProperties}><EditableText section={section} field="lede" fallback={d.lede} /></p>
                        <div className={`row row-wrap ${styles.heroCtas}`} data-reveal="rise" style={{ "--i": 3 } as CSSProperties}>
                            <ButtonLink href="#shade-finder" variant="accent" size="lg"><EditableText section={section} field="ctaPrimary" fallback="Find my shade" /></ButtonLink>
                            <ButtonLink href="#shades" variant="secondary" size="lg"><EditableText section={section} field="ctaSecondary" fallback="Shop the shades" /></ButtonLink>
                        </div>
                        <ul className={styles.proof} data-reveal="fade" style={{ "--i": 4 } as CSSProperties}>
                            <li><StarRating value={rating.average} /> <EditableTemplate section={section} field="proofReviews" fallback="{count} reviews" values={{ count: formatCompact(rating.count) }} /></li>
                            <li><EditableText section={section} field="proof1" fallback="Vegan & cruelty-free" /></li>
                            <li><EditableText section={section} field="proof2" fallback="Free shade swaps" /></li>
                        </ul>
                    </div>
                    <div className={styles.heroArt} aria-hidden="true">
                        <div className={styles.glow} />
                        {ORBIT.map((v, i) => (
                            <span key={v} className={styles.orb} style={{ "--swatch": `var(${v})`, "--o": i } as CSSProperties} />
                        ))}
                        <div className={styles.lipstick} style={{ "--swatch": hero.swatch } as CSSProperties}>
                            <span className={styles.base} />
                            <span className={styles.bullet} />
                            <span className={styles.sleeve} />
                            <span className={styles.cap} />
                        </div>
                        <p className={styles.shadeTag}>{hero.name} · {hero.finish}</p>
                    </div>
                </div>
                <p className={styles.scrollHint} aria-hidden="true"><EditableText section={section} field="scrollHint" fallback="Scroll to reveal" /></p>
            </div>
        </section>
    );
}

function ShadeFinderSection({ section, shades }: { section: ResolvedSection; shades: readonly LipShade[] }): React.JSX.Element {
    const d = BEAUTY_SECTION_DEFAULTS.shadeFinder;
    return (
        <section id="shade-finder" className="section" aria-labelledby="finder-title">
            <div className="container stack">
                <p className="eyebrow" data-reveal="fade"><EditableText section={section} field="eyebrow" fallback={d.eyebrow} /></p>
                <SplitText as="h2" text={prop(section, "title", d.title)} edit={editAttrs(section, "title", prop(section, "title", d.title))} className={`display ${styles.h2}`} />
                <p className={`text-muted ${styles.sub}`} data-reveal="rise"><EditableText section={section} field="lede" fallback={d.lede} /></p>
                <div data-reveal="scale">
                    <ShadeFinder shades={shades} editor={section.editable} />
                </div>
            </div>
        </section>
    );
}

function ShadeRailSection({ section, data, shades }: { section: ResolvedSection; data: StorefrontData; shades: readonly LipShade[] }): React.JSX.Element {
    const from = Math.min(...shades.map((s) => priceFrom(data.catalog, s.sku, s.price)));
    return (
        <section id="shades" className={styles.rail} data-scroll="pin" aria-labelledby="rail-title">
            <div className={styles.railStage}>
                <div className={`container ${styles.railHead}`}>
                    <div>
                        <p className="eyebrow"><EditableTemplate section={section} field="eyebrow" fallback="Lip color · from {price}" values={{ price: formatPrice(from) }} /></p>
                        <h2 id="rail-title" className={`display ${styles.h2}`}><EditableText section={section} field="title" fallback={BEAUTY_SECTION_DEFAULTS.shadeRail.title} /></h2>
                    </div>
                    <span className={styles.railProgress} aria-hidden="true"><span /></span>
                </div>
                <ul className={styles.railTrack}>
                    {shades.map((shade, i) => {
                        const sku = shade.sku;
                        const price = priceFrom(data.catalog, sku, shade.price);
                        return (
                            <li key={shade.id} id={sku} className={styles.shadeCard} style={{ "--swatch": shade.swatch, "--i": i } as CSSProperties}>
                                <div className={styles.shadeArt} aria-hidden="true" {...photoAttrs(section.editable, shade.handle)}>
                                    <ProductPhoto
                                        src={shade.image}
                                        alt=""
                                        sizes="(min-width: 1300px) 310px, 24vw"
                                        fallback={<span className={styles.miniBullet} />}
                                    />
                                    {shade.image ? <span className={styles.swatchChip} /> : null}
                                </div>
                                <div className={styles.shadeBody}>
                                    <h3 className={styles.shadeName} {...optionAttrs(section.editable && Boolean(shade.handle), shade.sku, shade.name)}>{shade.name}</h3>
                                    <p className={styles.shadeMeta}>
                                        <span {...productTitleAttrs(section.editable, shade.handle, shade.productName)}>{shade.productName}</span> · <span {...attributeAttrs(section.editable && Boolean(shade.handle), sku, "finish", shade.finish)}>{shade.finish}</span> · <span {...attributeAttrs(section.editable && Boolean(shade.handle), sku, "undertone", shade.undertone)}>{shade.undertone}</span> undertone
                                    </p>
                                    <div className="row row-between">
                                        <strong {...priceAttrs(section.editable, sku, price)}>{formatPrice(price)}</strong>
                                        <AddToBag sku={sku} name={shade.productName} variant={shade.name} price={shade.price} size="sm" label="Add" variantStyle="secondary" />
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </section>
    );
}

function ValuesSection({ section }: { section: ResolvedSection }): React.JSX.Element {
    return (
        <section className={`section ${styles.values}`} aria-labelledby="values-title">
            <div className="container stack">
                <SplitText as="h2" text={prop(section, "title", BEAUTY_SECTION_DEFAULTS.values.title)} edit={editAttrs(section, "title", prop(section, "title", BEAUTY_SECTION_DEFAULTS.values.title))} className={`display ${styles.h2}`} />
                <ul className={styles.valueGrid}>
                    {BEAUTY_VALUES.map((v, i) => (
                        <li key={v.title} className={styles.valueCard} data-reveal="rise" style={{ "--i": i } as CSSProperties}>
                            <span className={styles.valueNum}>0{i + 1}</span>
                            <h3><EditableText section={section} field={`card${i + 1}Title`} fallback={v.title} /></h3>
                            <p className="text-muted"><EditableText section={section} field={`card${i + 1}Body`} fallback={v.body} /></p>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}

function BundleSection({ section, price, bundle }: { section: ResolvedSection; price: number; bundle: BeautyCatalog["bundle"] }): React.JSX.Element {
    const d = BEAUTY_SECTION_DEFAULTS.bundle;
    return (
        <section id="edit" className="section" aria-labelledby="edit-title">
            <div className="container stack">
                <p className="eyebrow" data-reveal="fade"><EditableText section={section} field="eyebrow" fallback={d.eyebrow} /></p>
                <SplitText as="h2" {...templateProp(section, "title", "Any {pick} for {price}.", { pick: String(bundle.pick), price: formatPrice(price) })} className={`display ${styles.h2}`} />
                <p className={`text-muted ${styles.sub}`} data-reveal="rise"><EditableText section={section} field="lede" fallback={d.lede} /></p>
                <div data-reveal="rise"><BundleBuilder items={bundle.items} pick={bundle.pick} price={bundle.price} editor={section.editable} cta={templateProp(section, "cta", "Add the set to bag", {})} /></div>
            </div>
        </section>
    );
}

function ReviewsSection({ section, rating, items }: { section: ResolvedSection; rating: Rating; items: readonly { id: string; author: string; rating: number; body: string; meta: string }[] }): React.JSX.Element {
    return (
        <section id="reviews" className={`section ${styles.reviews}`} aria-labelledby="reviews-title">
            <div className={`container ${styles.reviewGrid}`}>
                <div className={styles.reviewSummary} data-reveal="left">
                    <p className="eyebrow"><EditableText section={section} field="eyebrow" fallback={BEAUTY_SECTION_DEFAULTS.reviews.eyebrow} /></p>
                    <h2 id="reviews-title" className={`display ${styles.bigScore}`}>{rating.average.toFixed(1)}</h2>
                    <StarRating value={rating.average} count={rating.count} />
                    <ul className={styles.dist} aria-label="Rating distribution">
                        {rating.distribution.map((share, i) => (
                            <li key={`star-${5 - i}`} data-reveal="fade" style={{ "--share": share, "--i": i } as CSSProperties}>
                                <span>{5 - i}★</span>
                                <span className={styles.distBar} aria-hidden="true"><span /></span>
                                <span>{Math.round(share * 100)}%</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <ul className={styles.wall}>
                    {items.map((r, i) => (
                        <li key={r.id} className={styles.review} data-reveal="rise" style={{ "--i": i % 3 } as CSSProperties}>
                            <StarRating value={r.rating} />
                            <blockquote>“{r.body}”</blockquote>
                            <p className={styles.reviewMeta}><strong>{r.author}</strong> · {r.meta}</p>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
