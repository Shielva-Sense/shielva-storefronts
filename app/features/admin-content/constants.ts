import type { Tone } from "@/components/ui/StatusBadge";
import type { PostStatus, SchemaToggles, ThemeKey } from "./types";

/** Optimistic rows carry this id prefix until the server returns the real uuid. */
export const PENDING_PREFIX = "pending-";

export function isPending(id: string): boolean {
    return id.startsWith(PENDING_PREFIX);
}

/** The page the builder edits — the storefront home. */
export const HOME_PAGE_SLUG = "home";

/** Length windows the API enforces (and that search engines display without truncation). */
export const SEO_LIMITS = {
    seoTitle: { min: 10, max: 70 },
    seoDescription: { min: 50, max: 170 },
    pageTitle: { min: 1, max: 120 },
    postTitle: { min: 3, max: 140 },
    excerpt: { min: 10, max: 300 },
    body: { min: 10, max: 50_000 },
    author: { min: 1, max: 80 },
    collectionCopy: { max: 2000 },
} as const;

export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const CANONICAL_RE = /^\/[a-z0-9/-]*$/;

export const SCHEMA_TOGGLES: readonly { key: keyof SchemaToggles; label: string; help: string }[] = [
    { key: "product", label: "Product", help: "Price, availability and rating rich results." },
    { key: "breadcrumb", label: "Breadcrumb", help: "Shows the page path in search results." },
    { key: "faq", label: "FAQ", help: "Expandable questions under the result." },
    { key: "localBusiness", label: "Local business", help: "Address, hours and map pack eligibility." },
];

export const AB_SPLIT = { min: 0, max: 100, step: 5, default: 50 } as const;

export const POST_STATUSES = ["draft", "published"] as const satisfies readonly PostStatus[];
export const POST_STATUS_LABEL: Record<PostStatus, string> = { draft: "Draft", published: "Published" };
export const POST_STATUS_TONE: Record<PostStatus, Tone> = { draft: "neutral", published: "success" };

export function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80)
        .replace(/-+$/g, "");
}

/** Where a length sits relative to its window — drives the counter badge. */
export function lengthTone(length: number, min: number, max: number): Tone {
    if (length === 0) return "neutral";
    return length < min || length > max ? "warning" : "success";
}

// ── Theme ──

export const THEME_COLOR_KEYS = ["brand", "brandStrong", "accent", "background", "surface", "text", "textMuted"] as const satisfies readonly ThemeKey[];
export type ThemeColorKey = (typeof THEME_COLOR_KEYS)[number];

export const THEME_LABELS: Record<ThemeKey, { label: string; help: string }> = {
    brand: { label: "Brand", help: "Primary buttons and links." },
    brandStrong: { label: "Brand (strong)", help: "Button hover and emphasis." },
    accent: { label: "Accent", help: "Focus rings and highlights." },
    background: { label: "Background", help: "Page background." },
    surface: { label: "Surface", help: "Cards, drawers and panels." },
    text: { label: "Text", help: "Body copy and headings." },
    textMuted: { label: "Muted text", help: "Captions and secondary copy." },
    radius: { label: "Button radius", help: "Corner rounding on buttons." },
};

export const RADIUS_OPTIONS = [
    { value: "0px", label: "Square (0px)" },
    { value: "4px", label: "Subtle (4px)" },
    { value: "8px", label: "Soft (8px)" },
    { value: "12px", label: "Round (12px)" },
    { value: "9999px", label: "Pill (9999px)" },
] as const;

export const DEFAULT_RADIUS = "9999px";
export const HEX_RE = /^#[0-9a-fA-F]{6}$/;
export const WCAG_AA = 4.5;

function channel(hex: string, offset: number): number {
    const c = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
    return 0.2126 * channel(hex, 1) + 0.7152 * channel(hex, 3) + 0.0722 * channel(hex, 5);
}

/** WCAG 2.1 contrast ratio between two #rrggbb colours (rounded to 2 dp); null when either is invalid. */
export function contrastRatio(fg: string, bg: string): number | null {
    if (!HEX_RE.test(fg) || !HEX_RE.test(bg)) return null;
    const [hi, lo] = [luminance(fg), luminance(bg)].sort((a, b) => b - a) as [number, number];
    return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
}

/** Normalises a computed CSS colour (#rgb, #rrggbb, rgb()) to #rrggbb, or "" when unparseable. */
export function toHex(value: string): string {
    const v = value.trim().toLowerCase();
    if (/^#[0-9a-f]{6}$/.test(v)) return v;
    if (/^#[0-9a-f]{3}$/.test(v)) return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`;
    const m = /^rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(v);
    if (!m) return "";
    return `#${[m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, "0")).join("")}`;
}

/** Store theme class whose CSS variables are the "brand defaults" (see styles/colors.scss). */
export function storeThemeClass(slug: string): string {
    return `theme-${slug}`;
}

// ── Timestamps ──


/** ISO → value for <input type="datetime-local"> in the admin's local time. */
export function toLocalInput(value: string | null): string {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n: number): string => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** datetime-local value → ISO (UTC); empty → null. */
export function fromLocalInput(value: string): string | null {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Where a section sits in its schedule window right now. */
export function scheduleState(startsAt: string | null, endsAt: string | null): { tone: Tone; label: string } | null {
    if (!startsAt && !endsAt) return null;
    const now = Date.now();
    const start = startsAt ? new Date(startsAt).getTime() : null;
    const end = endsAt ? new Date(endsAt).getTime() : null;
    if (start !== null && now < start) return { tone: "info", label: "Scheduled" };
    if (end !== null && now >= end) return { tone: "neutral", label: "Ended" };
    return { tone: "success", label: "Live window" };
}

