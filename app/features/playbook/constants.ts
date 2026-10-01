import { ROUTES } from "@/core/site";

export const ICP_PROFILES = [
    {
        id: "beauty",
        href: ROUTES.beauty,
        brand: "VELOUR",
        vertical: "Makeup & cosmetics",
        swatch: "--pb-beauty",
        persona: "Gen-Z & young millennial women, 18–30. Discover on Instagram/Reels, buy on impulse, price-aware ($15–45).",
        trigger: "“Will this shade actually suit me?” — shade anxiety is the #1 reason carts are abandoned.",
        grammar: "Product-as-hero, color-led, social proof everywhere. Pinned product choreography, shade rail, UGC wall.",
        widgets: ["Shade finder (depth × undertone)", "Bundle builder — any 3 for $65", "Photo review wall + rating histogram", "Mobile sticky ‘Find my shade’"],
        motion: "Color-wash + product choreography: lipstick uncaps as you scroll, the page's hue deepens.",
        roi: [
            { metric: "Conversion rate", lever: "Shade finder removes the guesswork" },
            { metric: "AOV", lever: "3-item set vs single lipstick" },
            { metric: "Returns", lever: "Right shade first time" },
        ],
        schema: "Product + Offer + AggregateRating (ItemList), BreadcrumbList",
    },
    {
        id: "salon",
        href: ROUTES.salon,
        brand: "Maison Noor",
        vertical: "Hair & beauty salon",
        swatch: "--pb-salon",
        persona: "Working professionals 25–45 within 5 km. Time-poor, event-driven (wedding, interview, date), search “salon near me”.",
        trigger: "“Can I get a good stylist at a time that works — and what will it cost?”",
        grammar: "Booking-first, calm editorial. The booking widget IS the hero. Transparent prices, senior-stylist proof, local trust.",
        widgets: ["Above-the-fold booking (service · stylist · day · time)", "Price menu with ‘Book this’ deep-links", "Before/after slider", "Noor Circle membership"],
        motion: "Calm editorial: arch masks open, hair strands draw in, process steps crossfade on a pinned scene.",
        roi: [
            { metric: "Bookings", lever: "Book in < 60 s without calling" },
            { metric: "Local organic traffic", lever: "HairSalon schema + hours + FAQ" },
            { metric: "Repeat revenue", lever: "Monthly membership" },
        ],
        schema: "HairSalon (LocalBusiness) + OpeningHours + OfferCatalog + ReserveAction, FAQPage",
    },
    {
        id: "fashion",
        href: ROUTES.fashion,
        brand: "ATELIER NORD",
        vertical: "Clothing & apparel",
        swatch: "--pb-fashion",
        persona: "Conscious millennials 25–40, mid-premium ($50–400). Research before buying, value quality & ethics, hate returns.",
        trigger: "“Will it fit, and is it worth the price?” — fit + value are the two objections.",
        grammar: "Editorial / brutalist. Giant type, horizontal lookbook, data-driven transparency.",
        widgets: ["Fit finder with confidence score", "Shop-the-look hotspots", "True-cost price breakdown", "Drop countdown + waitlist"],
        motion: "Brutalist travel: wordmark splits around the hero garment, lookbook pans sideways, cost bars scrub with scroll.",
        roi: [
            { metric: "Conversion rate", lever: "Fit certainty + free exchanges" },
            { metric: "Returns", lever: "Size recommended from profile" },
            { metric: "AOV & list growth", lever: "Shop the look, drop waitlist" },
        ],
        schema: "Product + Offer + AggregateRating (ItemList), BreadcrumbList",
    },
] as const;

export const REFERENCE_BRANDS = [
    { vertical: "Makeup", brand: "Fenty Beauty", pattern: "Shade finder in the first scroll; swatches across skin tones", lever: "CVR, fewer returns" },
    { vertical: "Makeup", brand: "Rare Beauty", pattern: "Viral hero products, photo reviews, mission block", lever: "CVR, repeat" },
    { vertical: "Makeup", brand: "Glossier", pattern: "Routine sets, UGC wall, editorial hub linking to products", lever: "AOV, organic" },
    { vertical: "Makeup", brand: "Charlotte Tilbury", pattern: "Virtual try-on, ‘complete the look’, tutorial hub", lever: "CVR, AOV" },
    { vertical: "Salon", brand: "Drybar", pattern: "Book Now hero, photo style menu, Barfly membership, location pages", lever: "Bookings, LTV" },
    { vertical: "Salon", brand: "Blo Blow Dry Bar", pattern: "Nearest-location booking, prices shown upfront", lever: "Booking completion" },
    { vertical: "Salon", brand: "Toni&Guy", pattern: "Salon finder per location, trend editorial", lever: "Local organic" },
    { vertical: "Fashion", brand: "Everlane", pattern: "Cost-breakdown transparency, fit-aware reviews", lever: "CVR, trust" },
    { vertical: "Fashion", brand: "Reformation", pattern: "Per-product footprint, model height/size shown", lever: "CVR, repeat" },
    { vertical: "Fashion", brand: "Skims", pattern: "Drops, waitlists, size-inclusive imagery", lever: "List growth, launch CVR" },
] as const;

export const MOTION_MODES = [
    { mode: "full", who: "Desktop, fine pointer", what: "Pinned scenes, scroll-scrubbed progress (--p) with inertial smoothing, horizontal travel." },
    { mode: "lite", who: "Phones & touch tablets", what: "No pinning — sections stack, rails become native swipe carousels, short entrance reveals." },
    { mode: "reduced", who: "prefers-reduced-motion", what: "Everything visible immediately. No transforms, no ticker." },
] as const;

export const COMMERCE_WORKFLOW = [
    { step: "Catalogue", detail: "Products, variants (shade / size), bundles, memberships, inventory per location" },
    { step: "Cart", detail: "Guest cart merged into the account cart at sign-in, free-shipping meter, validated bundle pricing" },
    { step: "Checkout", detail: "Shopify hosted checkout with Shopify Payments — cards, Apple Pay, Google Pay, Shop Pay; tax + shipping rates from Shopify" },
    { step: "Orders", detail: "Shopify webhooks (HMAC-verified) → Postgres → order, transaction and fulfillment timeline for admin and customer" },
    { step: "Post-purchase", detail: "Returns & exchanges refunded through Shopify, verified reviews, confirmation / shipped / review-request / win-back emails" },
    { step: "Bookings (salon)", detail: "Stylist hours & holidays, 10-minute slot holds, deposits paid on Shopify checkout, reminders, no-show tracking" },
] as const;

export const ADMIN_MODULES = [
    { name: "Page builder", detail: "Pages assembled from the ICP section library (hero types, finders, rails, proof walls). Reorder, A/B test, schedule." },
    { name: "Content & SEO", detail: "Per-page title, description, canonical, schema toggles, collection copy, blog / editorial hub." },
    { name: "Catalogue", detail: "Products, variants, media, bundles, memberships; price & stock pushed to Shopify; sync by SKU or Shopify CSV import." },
    { name: "Orders & customers", detail: "Orders with Shopify Payments transactions, refunds, timelines; customer lifetime value; segments with CSV export." },
    { name: "Bookings", detail: "Services, staff, hours, holidays, memberships." },
    { name: "Theme tokens", detail: "Brand colors and radius with a live WCAG contrast check — the same token layer these storefronts run on." },
] as const;

export const SEO_CHECKLIST = [
    "Server-rendered HTML for every section — motion is progressive enhancement, crawlers see all copy",
    "Structured data per ICP: Product/Offer/AggregateRating, HairSalon + FAQPage, BreadcrumbList",
    "Unique title + meta description + canonical + Open Graph per page",
    "sitemap.xml + robots.txt generated from the route table",
    "One display font per route (preloaded via next/font) — protects LCP",
    "No images in the LCP path for the demos; CMS media will ship via next/image (AVIF, sized)",
    "Semantic landmarks, skip link, ARIA radiogroups / tabs / slider, visible focus",
] as const;
