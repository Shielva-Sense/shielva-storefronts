import type { CSSProperties } from "react";
import { ProductPhoto } from "@/components/ui/ProductPhoto";
import { GARMENT_RATIO, GARMENT_SHAPE } from "../constants";
import type { FashionProduct, Garment } from "../types";
import styles from "./GarmentArt.module.scss";

/** Decorative garment silhouette (clip-path + fabric texture). Swapped for product photography via the CMS. */
export function GarmentArt({ garment, colour, className }: { garment: Garment; colour: string; className?: string | undefined }): React.JSX.Element {
    return (
        <span
            aria-hidden="true"
            className={`${styles.garment} ${className ?? ""}`}
            style={{ "--shape": GARMENT_SHAPE[garment], "--ratio": GARMENT_RATIO[garment], "--fabric": colour } as CSSProperties}
        />
    );
}

/** Product photo (Shopify CDN) when there is one, otherwise the drawn silhouette. */
export function ProductVisual({ product, className, sizes }: { product: FashionProduct; className?: string | undefined; sizes: string }): React.JSX.Element {
    return (
        <ProductPhoto
            src={product.image}
            alt={`${product.name} in ${product.colourName || "its colorway"}`}
            sizes={sizes}
            ratio="3 / 4"
            fallback={<GarmentArt garment={product.garment} colour={product.colour} className={className} />}
        />
    );
}
