const CURRENCY = "USD";
const LOCALE = "en-US";

const priceFormatter = new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: CURRENCY,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
});
const numberFormatter = new Intl.NumberFormat(LOCALE);
const compactFormatter = new Intl.NumberFormat(LOCALE, { notation: "compact", maximumFractionDigits: 1 });
const dayFormatter = new Intl.DateTimeFormat(LOCALE, { weekday: "short", day: "numeric", month: "short" });
const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, { dateStyle: "medium", timeStyle: "short" });

export function formatPrice(amount: number): string {
    return priceFormatter.format(amount);
}

export function formatNumber(n: number): string {
    return numberFormatter.format(n);
}

export function formatCompact(n: number): string {
    return compactFormatter.format(n);
}

export function formatDay(date: Date): string {
    return dayFormatter.format(date);
}

export function formatDateTime(iso: string): string {
    return dateTimeFormatter.format(new Date(iso));
}

/** Integer cents (API money) → localized currency. */
export function formatCents(cents: number): string {
    return formatPrice(cents / 100);
}

/** Ratio (0.123) → "12.3%". */
export function formatPercent(ratio: number, digits = 1): string {
    return `${formatNumber(Number((ratio * 100).toFixed(digits)))}%`;
}

/** ISO timestamp → "Oct 1, 2026, 2:57 AM"; missing → em dash. */
export function formatWhen(iso: string | null | undefined): string {
    return iso ? formatDateTime(iso) : "—";
}

/** ISO timestamp → "Thu, Oct 1"; missing → em dash. */
export function formatShortDay(iso: string | null | undefined): string {
    return iso ? formatDay(new Date(iso)) : "—";
}

/** "shopify_payments" → "Shopify Payments", "partially_refunded" → "Partially Refunded". */
export function humanize(value: string): string {
    return value
        .split(/[_\s-]+/)
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}

/** Dollars typed into an input → integer cents (null when empty or invalid). */
export function dollarsToCents(input: string): number | null {
    const trimmed = input.trim();
    if (!trimmed) return null;
    const n = Number(trimmed);
    return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
}

/** Integer cents → "12.50" for an editable dollars input. */
export function centsToInput(cents: number | null): string {
    return cents === null ? "" : (cents / 100).toFixed(2);
}

export const CURRENCY_CODE = CURRENCY;
export const LOCALE_CODE = LOCALE;
