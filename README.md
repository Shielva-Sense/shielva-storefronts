# shielva-storefronts

ICP-led storefronts + admin console (Next.js 16, React 19, SCSS tokens, React Query).

| Route | What it is |
|---|---|
| `/` | ICP playbook — why each audience gets a different page grammar |
| `/beauty` `/salon` `/fashion` | VELOUR (makeup), Maison Noor (salon), ATELIER NORD (clothing) — rendered from the page builder |
| `/{store}/account` | Passwordless account: orders + **Shopify Payments transactions**, timeline, returns/exchanges, reviews, bookings |
| `/{store}/journal` | Editorial hub (Article schema) |
| `/admin` | Console: dashboard & ICP comparison, orders, customers & segments, catalogue, returns, reviews, page builder, journal & SEO, theme, bookings, audit |

Payments happen on **Shopify's hosted checkout (Shopify Payments)**; the backend lives in
[`../shielva-storefronts-api`](../shielva-storefronts-api/README.md) and is reached through the
same-origin `/api/v1` rewrite so session cookies stay first-party.

## Run
```bash
pnpm install
cp .env.example .env.local   # API_ORIGIN, REVALIDATE_SECRET (same value as the API)
pnpm dev                     # http://localhost:3030
```

## Test
```bash
pnpm lint && pnpm exec tsc --noEmit && pnpm run build
pnpm exec playwright test    # full stack: API + Postgres + Shopify stub (e2e/shopify-stub.ts) + Next
```
E2E covers: add to bag → Shopify checkout → HMAC webhooks → customer sees the paid transaction;
bundle validation; admin price change pushed to Shopify and reflected on the storefront; page-builder
A/B variant; salon booking with and without a Shopify-paid deposit; SEO structured data; admin order
view; page-builder section toggle; phone-width overflow.

## Motion
`app/core/motion/scroll-engine.ts` — in-house (no framer-motion): `data-reveal` / `data-scroll`
attributes, one rAF loop, smoothed `--p` progress; `full` (desktop), `lite` (touch) and `reduced` modes.
