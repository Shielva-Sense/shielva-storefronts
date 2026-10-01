import type { Tone } from "@/components/ui/StatusBadge";
import { formatDay } from "@/core/formatters";
import { ADMIN_NAV } from "@/features/admin-session/constants";
export { isPending, PENDING_PREFIX } from "@/features/admin-content/constants";
import type { BookingStatus, MembershipStatus, StaffShift } from "./types";

/** Bookings only exist for the store the admin nav scopes the Bookings entry to (service businesses). */
const BOOKINGS_NAV = ADMIN_NAV.find((n) => n.href === "/admin/bookings");
export const BOOKINGS_STORE: string | null = BOOKINGS_NAV && "storeOnly" in BOOKINGS_NAV ? BOOKINGS_NAV.storeOnly : null;

export const BOOKING_WINDOW_DAYS = 7;

export const BOOKING_TABS = [
    { id: "schedule", label: "Schedule" },
    { id: "services", label: "Services" },
    { id: "staff", label: "Staff" },
    { id: "closures", label: "Closures" },
    { id: "memberships", label: "Memberships" },
] as const;
export type BookingTab = (typeof BOOKING_TABS)[number]["id"];

export function isBookingTab(v: string): v is BookingTab {
    return BOOKING_TABS.some((t) => t.id === v);
}

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
    held: "Held · awaiting deposit",
    confirmed: "Confirmed",
    cancelled: "Cancelled",
    no_show: "No-show",
    completed: "Completed",
    expired: "Hold expired",
};

export const BOOKING_STATUS_TONE: Record<BookingStatus, Tone> = {
    held: "warning",
    confirmed: "info",
    cancelled: "neutral",
    no_show: "danger",
    completed: "success",
    expired: "neutral",
};

/** Mirrors the API's STATUS_FLOW — only these transitions are offered. */
export const BOOKING_TRANSITIONS: Partial<Record<BookingStatus, readonly BookingStatus[]>> = {
    held: ["cancelled"],
    confirmed: ["completed", "no_show", "cancelled"],
};

export const TRANSITION_ACTION: Partial<Record<BookingStatus, { label: string; confirm?: { title: string; description: string; confirmLabel: string } }>> = {
    completed: { label: "Mark completed" },
    no_show: {
        label: "Mark no-show",
        confirm: { title: "Mark this booking as a no-show?", description: "The deposit is kept and the visit counts against the customer's no-show history.", confirmLabel: "Mark no-show" },
    },
    cancelled: {
        label: "Cancel",
        confirm: { title: "Cancel this booking?", description: "The slot is released and pending reminders are cancelled. Refund any deposit in Shopify separately.", confirmLabel: "Cancel booking" },
    },
};

export const MEMBERSHIP_TONE: Record<MembershipStatus, Tone> = { active: "success", expired: "neutral", cancelled: "danger" };
export const MEMBERSHIP_LABEL: Record<MembershipStatus, string> = { active: "Active", expired: "Expired", cancelled: "Cancelled" };

export const WEEKDAYS = [
    { day: 0, short: "Sun", long: "Sunday" },
    { day: 1, short: "Mon", long: "Monday" },
    { day: 2, short: "Tue", long: "Tuesday" },
    { day: 3, short: "Wed", long: "Wednesday" },
    { day: 4, short: "Thu", long: "Thursday" },
    { day: 5, short: "Fri", long: "Friday" },
    { day: 6, short: "Sat", long: "Saturday" },
] as const;

export const DEFAULT_SHIFT = { startMin: 10 * 60, endMin: 19 * 60 } as const;
export const SERVICE_MINUTES = { min: 10, max: 600, step: 5 } as const;

// ── Dates & times (store time zone) ──

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isDateKey(v: string): boolean {
    return DATE_RE.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));
}

function dateKeyFormatter(timeZone: string | undefined): Intl.DateTimeFormat {
    try {
        return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
    } catch {
        return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" });
    }
}


/** Today (YYYY-MM-DD) in the given IANA zone; the browser zone until the API reports the store's. */
export function todayIn(timeZone: string | undefined): string {
    return dateKeyFormatter(timeZone).format(new Date());
}

/** Calendar day (YYYY-MM-DD) a timestamp falls on in the store zone. */
export function dayKeyIn(ts: string, timeZone: string): string {
    return dateKeyFormatter(timeZone).format(new Date(ts));
}

export function addDays(dateKey: string, days: number): string {
    const d = new Date(`${dateKey}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
}

/** "Wed, Oct 1" for a YYYY-MM-DD key (noon UTC keeps the calendar day stable across zones). */
export function formatDateKey(dateKey: string): string {
    return formatDay(new Date(`${dateKey}T12:00:00Z`));
}

export function formatTimeIn(ts: string, timeZone: string): string {
    try {
        return new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", minute: "2-digit" }).format(new Date(ts));
    } catch {
        return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(ts));
    }
}

export function minutesToTime(min: number): string {
    return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

export function timeToMinutes(value: string): number | null {
    const m = /^(\d{2}):(\d{2})$/.exec(value);
    if (!m) return null;
    return Number(m[1]) * 60 + Number(m[2]);
}

export function weeklyMinutes(hours: readonly StaffShift[]): number {
    return hours.reduce((sum, h) => sum + Math.max(0, h.endMin - h.startMin), 0);
}

/** "Sun 09:00–21:00 · Tue 10:00–20:00" */
export function shiftSummary(hours: readonly StaffShift[]): string {
    if (hours.length === 0) return "No regular hours";
    return [...hours]
        .sort((a, b) => a.weekday - b.weekday || a.startMin - b.startMin)
        .map((h) => `${WEEKDAYS[h.weekday]?.short ?? "?"} ${minutesToTime(h.startMin)}–${minutesToTime(h.endMin)}`)
        .join(" · ");
}


export const HANDLE_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
