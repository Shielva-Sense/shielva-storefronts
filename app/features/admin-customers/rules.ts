import type { SegmentNumberKey } from "./constants";
import { dollarsToCents, formatCents } from "@/core/formatters";
import type { SegmentRules } from "./types";

export interface SegmentDraft {
    numbers: Record<SegmentNumberKey, string>;
    marketing: "any" | "yes" | "no";
    tag: string;
}

export const EMPTY_DRAFT: SegmentDraft = {
    numbers: { minOrders: "", maxOrders: "", minSpentCents: "", lastOrderWithinDays: "", lastOrderOlderThanDays: "" },
    marketing: "any",
    tag: "",
};

function toInt(v: string): number | undefined {
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
}

/** Form draft → API rules (omits blanks; dollars → cents). */
export function draftToRules(d: SegmentDraft): SegmentRules {
    const rules: SegmentRules = {};
    const minOrders = toInt(d.numbers.minOrders);
    const maxOrders = toInt(d.numbers.maxOrders);
    const spent = dollarsToCents(d.numbers.minSpentCents);
    const within = toInt(d.numbers.lastOrderWithinDays);
    const older = toInt(d.numbers.lastOrderOlderThanDays);
    if (minOrders !== undefined) rules.minOrders = minOrders;
    if (maxOrders !== undefined) rules.maxOrders = maxOrders;
    if (spent !== null) rules.minSpentCents = spent;
    if (within !== undefined && within >= 1) rules.lastOrderWithinDays = within;
    if (older !== undefined && older >= 1) rules.lastOrderOlderThanDays = older;
    if (d.marketing !== "any") rules.acceptsMarketing = d.marketing === "yes";
    if (d.tag.trim()) rules.tag = d.tag.trim();
    return rules;
}

/** Cross-field checks the API can't phrase nicely. */
export function rulesProblem(r: SegmentRules): string | null {
    if (r.minOrders !== undefined && r.maxOrders !== undefined && r.minOrders > r.maxOrders) return "Min orders is higher than max orders — nobody can match.";
    if (r.lastOrderWithinDays !== undefined && r.lastOrderOlderThanDays !== undefined && r.lastOrderOlderThanDays >= r.lastOrderWithinDays)
        return "“Older than” must be fewer days than “within” for the window to contain anyone.";
    return null;
}

/** Human summary: "2+ orders · spent ≥ $300 · tag vip". */
export function describeRules(r: SegmentRules): string {
    const parts: string[] = [];
    if (r.minOrders !== undefined && r.maxOrders !== undefined) parts.push(r.minOrders === r.maxOrders ? `exactly ${r.minOrders} ${r.minOrders === 1 ? "order" : "orders"}` : `${r.minOrders}–${r.maxOrders} orders`);
    else if (r.minOrders !== undefined) parts.push(`${r.minOrders}+ orders`);
    else if (r.maxOrders !== undefined) parts.push(`≤ ${r.maxOrders} orders`);
    if (r.minSpentCents !== undefined) parts.push(`spent ≥ ${formatCents(r.minSpentCents)}`);
    if (r.lastOrderWithinDays !== undefined) parts.push(`ordered in last ${r.lastOrderWithinDays}d`);
    if (r.lastOrderOlderThanDays !== undefined) parts.push(`no order for ${r.lastOrderOlderThanDays}d`);
    if (r.acceptsMarketing !== undefined) parts.push(r.acceptsMarketing ? "accepts marketing" : "no marketing consent");
    if (r.tag) parts.push(`tag “${r.tag}”`);
    return parts.length > 0 ? parts.join(" · ") : "Everyone";
}
