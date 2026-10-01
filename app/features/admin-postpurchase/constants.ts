import type { Tone } from "@/components/ui/StatusBadge";
import type { ReturnRecord, ReturnStatus, ReturnTarget, ReviewStatus } from "./types";

export const RETURN_TABS = [
    { id: "requested", label: "Requested" },
    { id: "approved", label: "Approved" },
    { id: "received", label: "Received" },
    { id: "refunded", label: "Refunded" },
    { id: "exchanged", label: "Exchanged" },
    { id: "rejected", label: "Rejected" },
    { id: "all", label: "All" },
] as const;
export type ReturnTab = (typeof RETURN_TABS)[number]["id"];

export const RETURN_TONES: Record<ReturnStatus, Tone> = {
    requested: "warning",
    approved: "info",
    received: "info",
    refunded: "success",
    exchanged: "success",
    rejected: "danger",
};

export interface ReturnAction {
    to: ReturnTarget;
    label: string;
    /** Destructive / money-moving: confirmDialog({ danger: true }) before submitting. */
    danger: boolean;
    description: string;
}

const ACTIONS: Record<ReturnTarget, ReturnAction> = {
    approved: { to: "approved", label: "Approve", danger: false, description: "The customer is emailed to pack the items and send them back." },
    rejected: { to: "rejected", label: "Reject", danger: true, description: "The customer is emailed that this request was declined (your note is included)." },
    received: { to: "received", label: "Mark received", danger: false, description: "Confirms the parcel arrived back and the items were checked." },
    refunded: { to: "refunded", label: "Refund", danger: true, description: "Sends a refund for the returned lines to Shopify. Shopify Payments moves the money; the status flips to refunded when Shopify's webhook arrives." },
    exchanged: { to: "exchanged", label: "Mark exchanged", danger: false, description: "Confirms the replacement was fulfilled in Shopify and emails the customer." },
};

/** Allowed transitions — mirrors the API's state machine (anything else is a 409). */
export function returnActions(r: Pick<ReturnRecord, "status" | "type">): ReturnAction[] {
    if (r.status === "requested") return [ACTIONS.approved, ACTIONS.rejected];
    if (r.status === "approved") return [ACTIONS.received];
    if (r.status === "received") return [r.type === "return" ? ACTIONS.refunded : ACTIONS.exchanged];
    return [];
}

export const REVIEW_TABS = [
    { id: "pending", label: "Pending" },
    { id: "approved", label: "Approved" },
    { id: "rejected", label: "Rejected" },
    { id: "all", label: "All" },
] as const;
export type ReviewTab = (typeof REVIEW_TABS)[number]["id"];

export const REVIEW_TONES: Record<ReviewStatus, Tone> = { pending: "warning", approved: "success", rejected: "danger" };
