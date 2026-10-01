import type { Tone } from "@/components/ui/StatusBadge";

export const CUSTOMER_SORTS = ["spent", "orders", "last"] as const;
export type CustomerSort = (typeof CUSTOMER_SORTS)[number];

export const CUSTOMERS_PAGE_SIZE = 20;
export const TAG_MAX_LENGTH = 40;
export const TAGS_MAX = 20;
export const SEGMENT_NAME_MAX = 80;

/** Segment-rule form fields → API rule keys. Money is typed in dollars and sent as cents. */
export const SEGMENT_NUMBER_FIELDS = [
    { key: "minOrders", label: "Min orders", help: "At least this many orders", unit: "count" },
    { key: "maxOrders", label: "Max orders", help: "At most this many orders", unit: "count" },
    { key: "minSpentCents", label: "Min lifetime spend ($)", help: "Total spent across all orders", unit: "dollars" },
    { key: "lastOrderWithinDays", label: "Last order within (days)", help: "Recent buyers", unit: "days" },
    { key: "lastOrderOlderThanDays", label: "Last order older than (days)", help: "Lapsed buyers — win-back", unit: "days" },
] as const;

export type SegmentNumberKey = (typeof SEGMENT_NUMBER_FIELDS)[number]["key"];

export const MARKETING_OPTIONS = [
    { value: "any", label: "Any consent" },
    { value: "yes", label: "Accepts marketing" },
    { value: "no", label: "Does not accept marketing" },
] as const;

export const BOOKING_TONES: Record<string, Tone> = {
    confirmed: "info",
    completed: "success",
    held: "warning",
    no_show: "danger",
    cancelled: "neutral",
    expired: "neutral",
};
