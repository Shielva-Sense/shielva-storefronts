import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import styles from "./ProductPhoto.module.scss";

interface ProductPhotoProps {
    /** Already-validated product photo URL (Shopify CDN); undefined renders `fallback`. */
    src: string | undefined;
    /** Empty string when the photo sits inside an aria-hidden / already-labelled card. */
    alt: string;
    sizes: string;
    /** Drawn art shown when the product has no photo yet. */
    fallback: ReactNode;
    /** CSS aspect-ratio ("3 / 4"); omitted = fill the parent box. */
    ratio?: string | undefined;
    className?: string | undefined;
}

/** Product photography when Shopify has a photo, otherwise the storefront's drawn product art. */
export function ProductPhoto({ src, alt, sizes, fallback, ratio, className }: ProductPhotoProps): React.JSX.Element {
    if (!src) return <>{fallback}</>;
    return (
        <span className={`${styles.box} ${className ?? ""}`} data-ratio={ratio ? "fixed" : "fill"} style={ratio ? ({ "--photo-ratio": ratio } as CSSProperties) : undefined}>
            <Image src={src} alt={alt} fill sizes={sizes} className={styles.img} />
        </span>
    );
}
