export const ANALYTICS_WINDOWS = [
    { value: "7", label: "Last 7 days" },
    { value: "30", label: "Last 30 days" },
    { value: "90", label: "Last 90 days" },
] as const;

export type AnalyticsWindow = (typeof ANALYTICS_WINDOWS)[number]["value"];
export const DEFAULT_WINDOW: AnalyticsWindow = "30";

export const FUNNEL_STEPS = [
    { key: "visitors", label: "Visitors", hint: "Distinct visitors who viewed a page" },
    { key: "addedToCart", label: "Added to bag", hint: "Visitors who added at least one item" },
    { key: "startedCheckout", label: "Started checkout", hint: "Visitors handed off to Shopify checkout" },
    { key: "purchased", label: "Purchased", hint: "Visitors with a paid order" },
] as const;

/** The storefront whose catalogue is appointment-based (bookings block on the dashboard). */
export const BOOKINGS_STORE = "salon";

/** Lift below this magnitude is reported as "no clear winner". */
export const LIFT_NOISE = 0.05;
