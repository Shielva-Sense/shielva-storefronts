/** Cross-storefront product shape — every ICP catalogue maps onto this. */
export interface Product {
    id: string;
    name: string;
    price: number;
    compareAt?: number;
    blurb: string;
    rating: number;
    reviews: number;
    /** CSS custom-property name holding the swatch colour (e.g. "--shade-ruby-noir"). */
    swatchVar?: string;
}

export interface CartLine {
    /** Line key (unique per sku + options). */
    id: string;
    /** Catalogue SKU — resolved to a Shopify variant at checkout. */
    sku: string;
    name: string;
    price: number;
    variant?: string;
    /** Bundle picks (SKUs), validated server-side against the bundle rule. */
    components?: string[];
    qty: number;
}

export interface Review {
    id: string;
    author: string;
    rating: number;
    body: string;
    meta: string;
}
