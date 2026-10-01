"use client";

import { ShoppingBag } from "lucide-react";
import { useCart } from "@/core/cart/CartContext";
import { useCatalog } from "@/features/storefront/CatalogContext";
import { Button } from "./Button";
import type { EditAttrs } from "@/features/inline-edit/markers";

interface AddToBagProps {
    sku: string;
    name: string;
    /** Built-in price (dollars) used only if the live catalogue is unavailable. */
    price: number;
    variant?: string;
    components?: string[];
    label?: string;
    /** Inline-edit markers for the label (admins only). */
    labelEdit?: EditAttrs;
    size?: "sm" | "md" | "lg";
    variantStyle?: "primary" | "secondary" | "accent";
    fullWidth?: boolean;
}

/** Client island — lets otherwise server-rendered product cards add to the bag at the live price. */
export function AddToBag({ sku, name, price, variant, components, label = "Add to bag", labelEdit, size = "md", variantStyle = "primary", fullWidth = false }: AddToBagProps): React.JSX.Element {
    const { add } = useCart();
    const catalog = useCatalog();
    const inStock = catalog.inStock(sku);
    const live = catalog.price(sku, price);
    return (
        <Button
            size={size}
            variant={variantStyle}
            fullWidth={fullWidth}
            disabled={!inStock}
            leftIcon={<ShoppingBag size={14} aria-hidden="true" />}
            onClick={() => add({ sku, name, price: live, ...(variant ? { variant } : {}), ...(components ? { components } : {}) })}
            aria-label={inStock ? `${label}: ${name}${variant ? `, ${variant}` : ""}` : `${name} is sold out`}
        >
            {inStock ? <span {...labelEdit}>{label}</span> : "Sold out"}
        </Button>
    );
}
