import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { ArrowLeft, UserRound } from "lucide-react";
import type { EditAttrs } from "@/features/inline-edit/markers";
import { CartProvider } from "@/core/cart/CartContext";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { CartButton } from "@/components/ui/CartButton";
import { CartDrawer } from "@/components/ui/CartDrawer";
import { ConfirmHost } from "@/components/ui/ConfirmDialog";
import { Toaster } from "@/components/ui/Toast";
import { absoluteUrl, ROUTES } from "@/core/site";
import { FrameReadyBeacon, PageViewBeacon } from "@/features/storefront/Beacons";
import { CatalogProvider } from "@/features/storefront/CatalogContext";
import { THEME_VALUE_RE, THEME_VARS } from "@/features/storefront/constants";
import type { CatalogItem, StoreSlug } from "@/features/storefront/types";
import styles from "./StorefrontLayout.module.scss";

export type StorefrontTheme = StoreSlug;

interface NavLink { href: string; label: string; edit?: EditAttrs }

interface StorefrontLayoutProps {
    theme: StorefrontTheme;
    fontClass: string;
    brand: string;
    nav: readonly NavLink[];
    freeShippingAt: number;
    catalog?: readonly CatalogItem[];
    experiments?: Record<string, "A" | "B">;
    /** Admin theme tokens (validated server-side, re-validated here before becoming CSS vars). */
    themeTokens?: Record<string, string>;
    announcement?: ReactNode;
    headerAction?: ReactNode;
    cartUpsell?: ReactNode;
    footer: ReactNode;
    /** Floating overlay above the page (the admin's inline editor). */
    overlay?: ReactNode;
    children: ReactNode;
}

function themeStyle(tokens: Record<string, string> | undefined): CSSProperties | undefined {
    if (!tokens) return undefined;
    const vars: Record<string, string> = {};
    for (const [key, cssVar] of Object.entries(THEME_VARS)) {
        const v = tokens[key];
        if (v && THEME_VALUE_RE.test(v)) vars[cssVar] = v;
    }
    return Object.keys(vars).length > 0 ? (vars as CSSProperties) : undefined;
}

const EMPTY_EXPERIMENTS: Record<string, "A" | "B"> = {};
const EMPTY_CATALOG: readonly CatalogItem[] = [];

/**
 * Shared shell for every ICP storefront: theme scope + admin theme tokens, live catalogue,
 * cart (→ Shopify checkout), motion engine, analytics beacon, header, footer.
 */
export function StorefrontLayout({
    theme,
    fontClass,
    brand,
    nav,
    freeShippingAt,
    catalog = EMPTY_CATALOG,
    experiments = EMPTY_EXPERIMENTS,
    themeTokens,
    announcement,
    headerAction,
    cartUpsell,
    footer,
    overlay,
    children,
}: StorefrontLayoutProps): React.JSX.Element {
    return (
        <div className={`theme-${theme} ${fontClass} ${styles.shell}`} data-theme={theme} style={themeStyle(themeTokens)}>
            <CatalogProvider items={catalog}>
                <CartProvider store={theme} experiments={experiments}>
                    <MotionProvider />
                    <PageViewBeacon store={theme} />
                    <FrameReadyBeacon />
                    {announcement}
                    <header className={styles.header}>
                        <div className={styles.headerInner}>
                            <Link href={absoluteUrl(ROUTES.playbook)} className={styles.back} aria-label="Back to the ICP playbook">
                                <ArrowLeft size={14} aria-hidden="true" />
                                <span>Playbook</span>
                            </Link>
                            <Link href={`/${theme}`} className={styles.brand}>{brand}</Link>
                            <nav aria-label={`${brand} sections`} className={styles.nav}>
                                <ul>
                                    {nav.map((item) => (
                                        <li key={`${item.href}-${item.label}`}><a href={item.href} {...item.edit}>{item.label}</a></li>
                                    ))}
                                </ul>
                            </nav>
                            <div className={styles.actions}>
                                {headerAction}
                                <Link href={`/${theme}/account`} className={styles.account} aria-label="Your account and orders">
                                    <UserRound size={15} aria-hidden="true" />
                                </Link>
                                <CartButton />
                            </div>
                        </div>
                    </header>
                    <main id="main-content" tabIndex={-1}>
                        <span id="top" />
                        {children}
                    </main>
                    <footer className={styles.footer}>{footer}</footer>
                    <CartDrawer freeShippingAt={freeShippingAt} upsell={cartUpsell} />
                    {overlay}
                    <Toaster />
                    <ConfirmHost />
                </CartProvider>
            </CatalogProvider>
        </div>
    );
}
