/**
 * Shielva scroll engine — the in-house replacement for framer-motion / GSAP.
 *
 * Two declarative primitives, both driven from HTML attributes so that
 * server-rendered sections animate without shipping per-section JS:
 *
 *   data-reveal="rise|fade|scale|left|right|mask"   one-shot entrance
 *       → engine sets data-inview="true" once; CSS owns the transition.
 *       → children may set style="--i: n" for staggered delays.
 *
 *   data-scroll="pin|through"                       scroll-linked progress
 *       → engine writes a smoothed `--p` (0 → 1) custom property on the
 *         element every frame it is visible. CSS consumes --p in
 *         transform / opacity only (GPU-composited, no layout thrash).
 *       → "pin": progress across a tall section whose child is sticky.
 *       → "through": progress from entering the viewport bottom to
 *         leaving the top (parallax, wipes).
 *
 * Why not scroll-jacking (Lenis-style virtual scroll)? It breaks native
 * momentum on iOS, find-in-page, anchor links and screen readers. Instead we
 * keep native scroll and *smooth the progress value* with a frame-rate
 * independent lerp — the animation feels inertial while scrolling stays native.
 *
 * Modes (html[data-motion]):
 *   full    — desktop + fine pointer: pinned scenes + scrubbed progress.
 *   lite    — touch / narrow: no pinning, sections stack; reveals only.
 *   reduced — prefers-reduced-motion: no transforms at all.
 */

export type MotionMode = "full" | "lite" | "reduced";

interface ProgressTrack {
    el: HTMLElement;
    range: "pin" | "through";
    smooth: number;
    target: number;
    current: number;
    visible: boolean;
}

const REVEAL_SELECTOR = "[data-reveal]";
const SCROLL_SELECTOR = "[data-scroll]";
const DEFAULT_SMOOTH = 0.14;
const SETTLE_EPSILON = 0.0004;
const FRAME_MS = 1000 / 60;

export const MOTION_QUERIES = {
    reduced: "(prefers-reduced-motion: reduce)",
    lite: "(pointer: coarse), (max-width: 767px)",
} as const;

export function resolveMotionMode(): MotionMode {
    if (window.matchMedia(MOTION_QUERIES.reduced).matches) return "reduced";
    if (window.matchMedia(MOTION_QUERIES.lite).matches) return "lite";
    return "full";
}

function clamp01(n: number): number {
    return n < 0 ? 0 : n > 1 ? 1 : n;
}

export class ScrollEngine {
    private readonly tracks = new Map<Element, ProgressTrack>();
    private revealIO: IntersectionObserver | null = null;
    private visibilityIO: IntersectionObserver | null = null;
    private mutationObserver: MutationObserver | null = null;
    private rafId = 0;
    private lastFrame = 0;
    private mode: MotionMode = "full";

    start(root: HTMLElement): void {
        this.mode = resolveMotionMode();
        document.documentElement.dataset.motion = this.mode;

        this.revealIO = new IntersectionObserver(this.onReveal, {
            rootMargin: "0px 0px -8% 0px",
            threshold: 0.12,
        });
        this.visibilityIO = new IntersectionObserver(this.onVisibility, {
            rootMargin: "25% 0px 25% 0px",
        });

        this.scan(root);
        this.mutationObserver = new MutationObserver((records) => {
            for (const record of records) {
                record.addedNodes.forEach((node) => {
                    if (node instanceof HTMLElement) this.scan(node);
                });
            }
        });
        this.mutationObserver.observe(root, { childList: true, subtree: true });

        window.addEventListener("scroll", this.kick, { passive: true });
        window.addEventListener("resize", this.kick, { passive: true });
        this.kick();
    }

    stop(): void {
        cancelAnimationFrame(this.rafId);
        this.rafId = 0;
        window.removeEventListener("scroll", this.kick);
        window.removeEventListener("resize", this.kick);
        this.revealIO?.disconnect();
        this.visibilityIO?.disconnect();
        this.mutationObserver?.disconnect();
        this.tracks.clear();
    }

    private scan(root: HTMLElement): void {
        const reveals = root.matches(REVEAL_SELECTOR) ? [root] : [];
        reveals.push(...root.querySelectorAll<HTMLElement>(REVEAL_SELECTOR));
        for (const el of reveals) {
            if (el.dataset.inview === "true") continue;
            if (this.mode === "reduced") el.dataset.inview = "true";
            else this.revealIO?.observe(el);
        }

        // Scroll-linked scenes only run on "full"; lite/reduced fall back to
        // the static values each scene declares via var(--p, <fallback>).
        if (this.mode !== "full") return;
        const scrollers = root.matches(SCROLL_SELECTOR) ? [root] : [];
        scrollers.push(...root.querySelectorAll<HTMLElement>(SCROLL_SELECTOR));
        for (const el of scrollers) {
            if (this.tracks.has(el)) continue;
            const smoothAttr = Number(el.dataset.smooth);
            this.tracks.set(el, {
                el,
                range: el.dataset.scroll === "through" ? "through" : "pin",
                smooth: Number.isFinite(smoothAttr) && smoothAttr > 0 ? smoothAttr : DEFAULT_SMOOTH,
                target: 0,
                current: 0,
                visible: false,
            });
            this.visibilityIO?.observe(el);
        }
    }

    private readonly onReveal = (entries: IntersectionObserverEntry[]): void => {
        for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            (entry.target as HTMLElement).dataset.inview = "true";
            this.revealIO?.unobserve(entry.target);
        }
    };

    private readonly onVisibility = (entries: IntersectionObserverEntry[]): void => {
        for (const entry of entries) {
            const track = this.tracks.get(entry.target);
            if (track) track.visible = entry.isIntersecting;
        }
        this.kick();
    };

    private readonly kick = (): void => {
        if (this.rafId) return;
        this.lastFrame = performance.now();
        this.rafId = requestAnimationFrame(this.tick);
    };

    private readonly tick = (now: number): void => {
        const dt = Math.min(64, now - this.lastFrame);
        this.lastFrame = now;
        const vh = window.innerHeight;

        // Phase 1 — READ every rect (no writes, so a single layout pass).
        const active: ProgressTrack[] = [];
        for (const track of this.tracks.values()) {
            if (!track.visible) continue;
            const rect = track.el.getBoundingClientRect();
            track.target =
                track.range === "pin"
                    ? clamp01(-rect.top / Math.max(1, rect.height - vh))
                    : clamp01((vh - rect.top) / (vh + rect.height));
            active.push(track);
        }

        // Phase 2 — WRITE smoothed progress (frame-rate independent lerp).
        let settling = false;
        for (const track of active) {
            const alpha = 1 - Math.pow(1 - track.smooth, dt / FRAME_MS);
            const next = track.current + (track.target - track.current) * alpha;
            track.current = Math.abs(track.target - next) < SETTLE_EPSILON ? track.target : next;
            if (track.current !== track.target) settling = true;
            track.el.style.setProperty("--p", track.current.toFixed(4));
        }

        this.rafId = settling ? requestAnimationFrame(this.tick) : 0;
    };
}
