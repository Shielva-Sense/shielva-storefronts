import { NewsletterForm } from "@/components/ui/NewsletterForm";
import { siteEditAttrs } from "@/features/inline-edit/markers";
import type { SiteFooter } from "@/features/storefront/site";
import styles from "./StoreFooter.module.scss";

interface StoreFooterProps {
    brand: string;
    footer: SiteFooter;
    newsletter: { label: string; success: string };
    newsletterCta: string;
    /** Resolves in-page anchors for pages other than the storefront home. */
    href: (href: string) => string;
    /** Admin viewing → footer text carries inline-edit markers. */
    editor?: boolean;
}

export function StoreFooter({ brand, footer, newsletter, newsletterCta, href, editor = false }: StoreFooterProps): React.JSX.Element {
    return (
        <div className={styles.inner}>
            <div className={styles.top}>
                <div className={styles.lead}>
                    <p className={styles.brand}>{brand}</p>
                    <p className={styles.tagline} {...siteEditAttrs(editor, "footer.tagline", footer.tagline)}>{footer.tagline}</p>
                    <NewsletterForm {...newsletter} cta={newsletterCta} ctaEdit={siteEditAttrs(editor, "labels.newsletterCta", newsletterCta)} />
                </div>
                {footer.columns.map((col, c) => (
                    <div key={`${c}-${col.title}`}>
                        <h2 className={styles.colTitle} {...siteEditAttrs(editor, `footer.columns.${c}.title`, col.title)}>{col.title}</h2>
                        <ul className={styles.list}>
                            {col.links.map((link, l) => {
                                const attrs = siteEditAttrs(editor, `footer.columns.${c}.links.${l}.label`, link.label);
                                return (
                                    <li key={`${l}-${link.label}`}>
                                        {link.href ? <a href={href(link.href)} className={styles.link} {...attrs}>{link.label}</a> : <span {...attrs}>{link.label}</span>}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </div>
            <p className={styles.legal} {...siteEditAttrs(editor, "footer.legal", footer.legal)}>{footer.legal}</p>
        </div>
    );
}
