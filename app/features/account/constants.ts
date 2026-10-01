import type { Tone } from "@/components/ui/StatusBadge";

export const FINANCIAL_TONE: Record<string, Tone> = {
    paid: "success",
    pending: "warning",
    authorized: "info",
    partially_paid: "warning",
    partially_refunded: "info",
    refunded: "neutral",
    voided: "neutral",
};

export const FULFILLMENT_TONE: Record<string, Tone> = { fulfilled: "success", partial: "info", restocked: "neutral" };

export const RETURN_TONE: Record<string, Tone> = { requested: "warning", approved: "info", received: "info", refunded: "success", exchanged: "success", rejected: "danger" };

export const BOOKING_TONE: Record<string, Tone> = { confirmed: "success", held: "warning", completed: "neutral", cancelled: "neutral", no_show: "danger", expired: "neutral" };

