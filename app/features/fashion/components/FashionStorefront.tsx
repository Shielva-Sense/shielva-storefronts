import type { CSSProperties } from "react";
import { StorefrontLayout } from "@/components/layouts/StorefrontLayout";
import { SplitText } from "@/components/motion/SplitText";
import { AddToBag } from "@/components/ui/AddToBag";
import { ButtonLink } from "@/components/ui/Button";
import { NewsletterForm } from "@/components/ui/NewsletterForm";
import { anton } from "@/core/fonts";
import { formatPrice } from "@/core/formatters";
import { AnnouncementSection, CollectionCopy, EditableNumber, EditableTemplate, EditableText, JournalTeaser, MarqueeSection, numberProp, prop, SectionFrame } from "@/components/sections/SharedSections";
import { editAttrs, photoAttrs, productPriceAttrs, productTitleAttrs } from "@/features/inline-edit/markers";
import { priceFrom } from "@/features/storefront/catalog";
import type { ResolvedSection, StorefrontData } from "@/features/storefront/types";
import { InlineEditorLoader } from "@/features/inline-edit/components/InlineEditorLoader";
import { storefrontChrome } from "@/features/storefront/chrome";
import type { FashionProduct } from "../types";
import {
    FASHION_BRAND,
    FASHION_FREE_SHIPPING_AT,
    FASHION_MARQUEE,
    FASHION_SECTION_DEFAULTS,
    LOOKS,
    TRUE_COST,
} from "../constants";
import { DropCountdown } from "./DropCountdown";
import { FitFinder } from "./FitFinder";
import { fashionCatalog, skuForSize } from "../catalog";
import { ProductVisual } from "./GarmentArt";
import { LookHotspot } from "./LookHotspot";
import styles from "./Fashion.module.scss";


export function FashionStorefront({ data }: { data: StorefrontData }): React.JSX.Element {
    const d = FASHION_SECTION_DEFAULTS;
    const collection = fashionCatalog(data.products);
    const costProduct = collection.find(TRUE_COST.productId);
    const livePrice = (p: FashionProduct): number => priceFrom(data.catalog, skuForSize(p, "M"), p.price);

    const render = (section: ResolvedSection): React.ReactNode => {
        switch (section.type) {
            case "fashion.hero":
                return (
                    <section className={styles.hero} data-scroll="pin" aria-labelledby="fashion-hero-title">
                        <div className={styles.heroStage}>
                            <h1 id="fashion-hero-title" className={styles.wordmark}>
                                <span className={styles.rowA}><EditableText section={section} field="rowA" fallback={d.hero.rowA} /></span>
                                <span className={styles.rowB}><EditableText section={section} field="rowB" fallback={d.hero.rowB} /></span>
                            </h1>
                            <div className={styles.heroCoat}>
                                <ProductVisual product={collection.hero} sizes="30vw" />
                            </div>
                            <div className={`container ${styles.heroMeta}`}>
                                <p><EditableText section={section} field="tagline" fallback={d.hero.tagline} /></p>
                                <div className="row row-wrap">
                                    <ButtonLink href="#lookbook" size="lg"><EditableText section={section} field="ctaPrimary" fallback="See the lookbook" /></ButtonLink>
                                    <ButtonLink href="#fit" size="lg" variant="secondary"><EditableText section={section} field="ctaSecondary" fallback="Find my size" /></ButtonLink>
                                </div>
                            </div>
                        </div>
                    </section>
                );
            case "marquee":
                return <MarqueeSection section={section} fallback={FASHION_MARQUEE} label="Our promises" />;
            case "fashion.lookbook":
                return (
                    <section id="lookbook" className={styles.lookbook} data-scroll="pin" aria-labelledby="lookbook-title">
                        <div className={styles.lookStage}>
                            <div className={`container ${styles.lookHead}`}>
                                <h2 id="lookbook-title" className={styles.h2}><EditableText section={section} field="title" fallback={d.lookbook.title} /></h2>
                                <p className="text-muted"><EditableText section={section} field="note" fallback={d.lookbook.note} /></p>
                            </div>
                            <ul className={styles.lookTrack}>
                                {LOOKS.map((look, li) => (
                                    <li key={look.id} className={styles.look} style={{ "--look-bg": `var(${look.bgVar})` } as CSSProperties}>
                                        {look.garments.map((g) => {
                                            const p = collection.find(g.productId);
                                            return p ? (
                                                <span key={g.productId} className={styles.lookGarment} style={{ "--gx": `${g.x}%`, "--gy": `${g.y}%`, "--gw": `${g.w}%` } as CSSProperties}>
                                                    <ProductVisual product={p} sizes="20vw" />
                                                </span>
                                            ) : null;
                                        })}
                                        {look.hotspots.map((h) => {
                                            const p = collection.find(h.productId);
                                            return p ? <LookHotspot key={h.productId} product={p} x={h.x} y={h.y} /> : null;
                                        })}
                                        <div className={styles.lookCaption}>
                                            <h3><EditableText section={section} field={`look${li + 1}Title`} fallback={look.title} /></h3>
                                            <p><EditableText section={section} field={`look${li + 1}Note`} fallback={look.note} /></p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>
                );
            case "fashion.fit":
                return (
                    <section id="fit" className="section" aria-labelledby="fit-title">
                        <div className="container stack">
                            <p className="eyebrow" data-reveal="fade"><EditableText section={section} field="eyebrow" fallback={d.fit.eyebrow} /></p>
                            <h2 id="fit-title" className={styles.h2}><SplitText text={prop(section, "title", d.fit.title)} edit={editAttrs(section, "title", prop(section, "title", d.fit.title))} /></h2>
                            <p className={`text-muted ${styles.sub}`} data-reveal="rise"><EditableText section={section} field="lede" fallback={d.fit.lede} /></p>
                            <div data-reveal="rise"><FitFinder products={collection.items} /></div>
                        </div>
                    </section>
                );
            case "fashion.trueCost": {
                const ours = numberProp(section, "ours", TRUE_COST.ours);
                const traditional = numberProp(section, "traditional", TRUE_COST.traditional);
                const lines = TRUE_COST.lines.map((line, i) => ({ key: i + 1, label: line.label, amount: numberProp(section, `line${i + 1}Amount`, line.amount) }));
                const usd = (n: number): string => formatPrice(n);
                return (
                    <section id="pricing" className={`section ${styles.cost}`} data-scroll="through" aria-labelledby="cost-title">
                        <div className={`container ${styles.costGrid}`}>
                            <div className="stack">
                                <p className="eyebrow"><EditableText section={section} field="eyebrow" fallback="True cost" /></p>
                                <h2 id="cost-title" className={styles.h2}><EditableText section={section} field="title" fallback={d.trueCost.title} /></h2>
                                <p className={styles.sub}>
                                    <EditableTemplate
                                        section={section}
                                        field="lede"
                                        fallback="{product}: {ours} with us, about {traditional} at a traditional retailer. Here is where your money goes."
                                        values={{ product: costProduct?.name ?? "The Wool Overcoat", ours: usd(ours), traditional: usd(traditional) }}
                                    />
                                </p>
                            </div>
                            <div className={styles.bars}>
                                <ul className={styles.costList}>
                                    {lines.map((line, i) => (
                                        <li key={line.key} style={{ "--share": line.amount / Math.max(ours, 1), "--i": i } as CSSProperties}>
                                            <span className={styles.costLabel}><EditableText section={section} field={`line${line.key}Label`} fallback={line.label} /></span>
                                            <span className={styles.costBar} aria-hidden="true"><span /></span>
                                            <span className={styles.costAmount}><EditableNumber section={section} field={`line${line.key}Amount`} fallback={TRUE_COST.lines[i]?.amount ?? 0} format={usd} /></span>
                                        </li>
                                    ))}
                                </ul>
                                <div className={styles.compare}>
                                    <p><span><EditableText section={section} field="oursLabel" fallback="ATELIER NORD" /></span><strong><EditableNumber section={section} field="ours" fallback={TRUE_COST.ours} format={usd} /></strong></p>
                                    <span className={styles.compareBar} style={{ "--share": ours / Math.max(traditional, 1), "--i": 5 } as CSSProperties} aria-hidden="true"><span /></span>
                                    <p><span><EditableText section={section} field="traditionalLabel" fallback="Traditional retail" /></span><strong><EditableNumber section={section} field="traditional" fallback={TRUE_COST.traditional} format={usd} /></strong></p>
                                    <span className={`${styles.compareBar} ${styles.muted}`} style={{ "--share": 1, "--i": 6 } as CSSProperties} aria-hidden="true"><span /></span>
                                </div>
                            </div>
                        </div>
                    </section>
                );
            }
            case "fashion.shop":
                return (
                    <section id="shop" className="section" aria-labelledby="shop-title">
                        <div className="container stack">
                            <div className="row row-between row-wrap">
                                <h2 id="shop-title" className={styles.h2}><SplitText text={prop(section, "title", d.shop.title)} edit={editAttrs(section, "title", prop(section, "title", d.shop.title))} /></h2>
                                <p className="text-muted"><EditableText section={section} field="note" fallback={d.shop.note} /></p>
                            </div>
                            <ul className={styles.grid}>
                                {collection.items.map((p, i) => (
                                    <li key={p.id} id={p.id} className={styles.card} data-reveal="rise" style={{ "--i": i % 3 } as CSSProperties}>
                                        <div className={styles.cardArt} {...photoAttrs(section.editable, p.id)}>
                                            <ProductVisual product={p} className={styles.cardGarment} sizes="(min-width: 1100px) 30vw, (min-width: 700px) 45vw, 90vw" />
                                        </div>
                                        <div className={styles.cardBody}>
                                            <div>
                                                <h3 className={styles.cardName} {...productTitleAttrs(section.editable, p.id, p.name)}>{p.name}</h3>
                                                <p className={styles.cardMeta}>{[p.colourName, p.material].filter(Boolean).join(" · ")}</p>
                                            </div>
                                            <p className={styles.cardPrice} {...productPriceAttrs(section.editable, p.id, livePrice(p))}>{formatPrice(livePrice(p))}</p>
                                        </div>
                                        <AddToBag sku={skuForSize(p, "M")} name={p.name} price={p.price} variant="Size M" label={prop(section, "cardCta", "Add size M")} labelEdit={editAttrs(section, "cardCta", prop(section, "cardCta", "Add size M"))} size="sm" variantStyle="secondary" fullWidth />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>
                );
            case "fashion.drop":
                return (
                    <section className={styles.drop} aria-labelledby="drop-title">
                        <div className={`container ${styles.dropGrid}`}>
                            <div className="stack">
                                <p className="eyebrow"><EditableText section={section} field="eyebrow" fallback={d.drop.eyebrow} /></p>
                                <h2 id="drop-title" className={styles.h2}><EditableText section={section} field="title" fallback={d.drop.title} /></h2>
                                <p className={styles.sub}><EditableText section={section} field="lede" fallback={d.drop.lede} /></p>
                                <NewsletterForm label="Email for the waitlist" cta={prop(section, "waitlistCta", "Join waitlist")} ctaEdit={editAttrs(section, "waitlistCta", prop(section, "waitlistCta", "Join waitlist"))} success="You're on the list — we'll email you 24h before the drop." />
                            </div>
                            <DropCountdown />
                        </div>
                    </section>
                );
            case "journal.teaser":
                return <JournalTeaser store="fashion" title={prop(section, "title", "From the journal")} edit={editAttrs(section, "title", prop(section, "title", "From the journal"))} more={prop(section, "more", "All stories")} moreEdit={editAttrs(section, "more", prop(section, "more", "All stories"))} posts={data.posts} />;
            case "announcement":
                return <AnnouncementSection text={prop(section, "text", "")} edit={editAttrs(section, "text", prop(section, "text", ""))} />;
            default:
                return null;
        }
    };

    const chrome = storefrontChrome({ store: "fashion", brand: FASHION_BRAND, site: data.site, home: true, editor: data.editor });
    return (
        <StorefrontLayout
            overlay={data.editor ? <InlineEditorLoader store="fashion" site={data.site} /> : null}
            theme="fashion"
            fontClass={anton.variable}
            brand={FASHION_BRAND}
            nav={chrome.nav}
            freeShippingAt={FASHION_FREE_SHIPPING_AT}
            catalog={data.catalog}
            experiments={data.experiments}
            themeTokens={data.theme}
            footer={chrome.footer}
        >
            {data.sections.map((section) => (
                <SectionFrame key={section.id} store="fashion" section={section}>
                    {render(section)}
                </SectionFrame>
            ))}
            <CollectionCopy title="About ATELIER NORD" text={data.page?.seo.collectionCopy ?? ""} />
        </StorefrontLayout>
    );
}
