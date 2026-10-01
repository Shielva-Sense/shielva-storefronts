/**
 * Local Shopify stand-in for E2E and demos. Implements exactly the surface the API uses:
 *   Storefront API  cartCreate                          → hosted checkout URL
 *   Admin API       productVariants / productVariantsBulkUpdate / inventorySetQuantities / refundCreate
 *   Hosted checkout GET /checkouts/:token  →  POST /checkouts/:token/pay (Shopify Payments)
 * and delivers HMAC-signed webhooks to the API exactly like Shopify does.
 *
 * Test-only controls (not part of Shopify): POST /__control/:shop/orders/:id/fulfill,
 *   POST /__control/:shop/products (a merchant creating a product in Shopify admin)
 */
import { createHmac, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

const PORT = Number(process.env.STUB_PORT ?? 8099);
const API = process.env.STUB_API_ORIGIN ?? "http://127.0.0.1:8041";
const STOREFRONT = process.env.STUB_STOREFRONT_ORIGIN ?? "http://localhost:3031";
const ENV_FILE = process.env.STUB_API_ENV_FILE ?? new URL("../../shielva-storefronts-api/.env.e2e", import.meta.url).pathname;

function readEnv(path: string): Record<string, string> {
    return Object.fromEntries(
        readFileSync(decodeURIComponent(path), "utf8")
            .split("\n")
            .filter((l) => l && !l.startsWith("#") && l.includes("="))
            .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
    );
}

interface Shop {
    domain: string;
    slug: string;
    webhookSecret: string;
    storefrontToken: string;
    adminToken: string;
}
interface Variant {
    variantId: string;
    productId: string;
    inventoryItemId: string;
    sku: string;
    title: string;
    productTitle: string;
    handle: string;
    priceCents: number;
    compareAtCents: number | null;
    qty: number;
}
interface Cart {
    token: string;
    shop: Shop;
    lines: { variantId: string; quantity: number; attributes: { key: string; value: string }[] }[];
    attributes: { key: string; value: string }[];
    email: string | null;
}
interface Order {
    id: string;
    name: string;
    shop: Shop;
    email: string;
    lines: { id: string; sku: string; title: string; variantTitle: string | null; quantity: number; priceCents: number; variantId: string }[];
    totalCents: number;
    refundedCents: number;
    transactionId: string;
    attributes: { name: string; value: string }[];
    createdAt: string;
    updatedAt: string;
    financialStatus: string;
    fulfillmentStatus: string | null;
}

const env = readEnv(ENV_FILE);
const SHOPS: Shop[] = (["BEAUTY", "SALON", "FASHION"] as const).map((k) => ({
    domain: env[`SHOPIFY_${k}_SHOP`] ?? "",
    slug: k.toLowerCase(),
    webhookSecret: env[`SHOPIFY_${k}_WEBHOOK_SECRET`] ?? "",
    storefrontToken: env[`SHOPIFY_${k}_STOREFRONT_TOKEN`] ?? "",
    adminToken: env[`SHOPIFY_${k}_ADMIN_TOKEN`] ?? "",
}));

interface StubProduct {
    productId: string;
    handle: string;
    title: string;
    bodyHtml: string;
    status: string;
    tags: string[];
    images: string[];
}

const catalogs = new Map<string, Variant[]>();
const STAGED_PHOTO = "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-product-1_large.png";
const productsByShop = new Map<string, Map<string, StubProduct>>();
const carts = new Map<string, Cart>();
const orders = new Map<string, Order>();
let seq = 1;
let orderNumber = 1001;
const nextId = (): string => String(7_000_000_000 + seq++);
const money = (c: number): string => (c / 100).toFixed(2);
const now = (): string => new Date().toISOString();

/** Catalogue mirrors the API's seeded SKUs (fetched once per shop), with Shopify-style ids. */
async function catalog(shop: Shop): Promise<Variant[]> {
    const cached = catalogs.get(shop.domain);
    if (cached) return cached;
    const res = await fetch(`${API}/api/v1/catalog`, { headers: { "x-storefront": shop.slug } });
    const body = (await res.json()) as {
        items: { sku: string; option: string | null; priceCents: number; compareAtCents: number | null; inventoryQty: number; handle: string; title: string }[];
        products: { handle: string; title: string; description: string; tags: string[]; media: string[] }[];
    };
    const productIds = new Map<string, string>();
    const shopProducts = new Map<string, StubProduct>();
    productsByShop.set(shop.domain, shopProducts);
    const list = body.items.map((i) => {
        if (!productIds.has(i.handle)) {
            const productId = nextId();
            productIds.set(i.handle, productId);
            // Mirror the merchant's Shopify data (tags drive storefront placement and are owned by Shopify).
            const p = body.products.find((x) => x.handle === i.handle);
            shopProducts.set(productId, { productId, handle: i.handle, title: i.title, bodyHtml: p?.description ? `<p>${p.description}</p>` : "", status: "active", tags: p?.tags ?? [], images: p?.media ?? [] });
        }
        return {
            variantId: nextId(),
            productId: productIds.get(i.handle) as string,
            inventoryItemId: nextId(),
            sku: i.sku,
            title: i.option ?? "Default Title",
            productTitle: i.title,
            handle: i.handle,
            priceCents: i.priceCents,
            compareAtCents: i.compareAtCents,
            qty: i.inventoryQty > 0 ? i.inventoryQty : 100,
        };
    });
    catalogs.set(shop.domain, list);
    return list;
}

async function webhook(shop: Shop, topic: string, payload: unknown): Promise<number> {
    const body = JSON.stringify(payload);
    const res = await fetch(`${API}/webhooks/shopify`, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            "x-shopify-topic": topic,
            "x-shopify-shop-domain": shop.domain,
            "x-shopify-webhook-id": randomUUID(),
            "x-shopify-api-version": "2026-07",
            "x-shopify-hmac-sha256": createHmac("sha256", shop.webhookSecret).update(body).digest("base64"),
        },
        body,
    });
    if (!res.ok) console.error(`[stub] webhook ${topic} → ${res.status} ${await res.text()}`);
    return res.status;
}

function orderPayload(o: Order): Record<string, unknown> {
    return {
        id: Number(o.id),
        name: o.name,
        email: o.email,
        created_at: o.createdAt,
        updated_at: o.updatedAt,
        cancelled_at: null,
        currency: "USD",
        financial_status: o.financialStatus,
        fulfillment_status: o.fulfillmentStatus,
        subtotal_price: money(o.totalCents),
        total_price: money(o.totalCents),
        total_discounts: "0.00",
        total_tax: "0.00",
        total_shipping_price_set: { shop_money: { amount: "0.00", currency_code: "USD" } },
        note_attributes: o.attributes,
        customer: { id: 9_100_000 + (o.email.length % 97), email: o.email, first_name: o.email.split("@")[0], last_name: "Tester", email_marketing_consent: { state: "subscribed" } },
        line_items: o.lines.map((l) => ({ id: Number(l.id), sku: l.sku, title: l.title, variant_title: l.variantTitle, quantity: l.quantity, price: money(l.priceCents), variant_id: Number(l.variantId) })),
    };
}

function productPayload(shop: Shop, productId: string): Record<string, unknown> {
    const product = productsByShop.get(shop.domain)?.get(productId);
    const vs = (catalogs.get(shop.domain) ?? []).filter((v) => v.productId === productId);
    return {
        id: Number(productId),
        title: product?.title ?? vs[0]?.productTitle ?? "",
        handle: product?.handle ?? vs[0]?.handle,
        status: product?.status ?? "active",
        body_html: product?.bodyHtml ?? "",
        tags: (product?.tags ?? []).join(", "),
        images: (product?.images ?? []).map((src) => ({ src })),
        variants: vs.map((v, i) => ({
            id: Number(v.variantId),
            sku: v.sku,
            title: v.title,
            option1: v.title,
            price: money(v.priceCents),
            compare_at_price: v.compareAtCents === null ? null : money(v.compareAtCents),
            inventory_quantity: v.qty,
            inventory_item_id: Number(v.inventoryItemId),
            position: i + 1,
        })),
    };
}

const bump = (o: Order): void => {
    o.updatedAt = new Date(Math.max(Date.now(), new Date(o.updatedAt).getTime() + 1000)).toISOString();
};

// ─────────────────────────── GraphQL ───────────────────────────

const gid = (type: string, id: string): string => `gid://shopify/${type}/${id}`;
const tail = (g: string): string => g.split("/").pop() ?? g;

async function storefrontGql(shop: Shop, query: string, variables: Record<string, unknown>): Promise<unknown> {
    if (!query.includes("cartCreate")) return { errors: [{ message: "stub: unsupported storefront operation" }] };
    const input = variables.input as { lines: Cart["lines"] & { merchandiseId: string }[]; attributes: Cart["attributes"]; buyerIdentity?: { email?: string } };
    const cat = await catalog(shop);
    const lines = (input.lines as unknown as { merchandiseId: string; quantity: number; attributes: Cart["attributes"] }[]).map((l) => ({ variantId: tail(l.merchandiseId), quantity: l.quantity, attributes: l.attributes ?? [] }));
    const missing = lines.find((l) => !cat.some((v) => v.variantId === l.variantId));
    if (missing) return { data: { cartCreate: { cart: null, userErrors: [{ field: ["lines"], message: `Merchandise ${missing.variantId} does not exist` }] } } };
    const token = randomUUID().replace(/-/g, "");
    carts.set(token, { token, shop, lines, attributes: input.attributes ?? [], email: input.buyerIdentity?.email ?? null });
    return { data: { cartCreate: { cart: { id: gid("Cart", token), checkoutUrl: `http://127.0.0.1:${PORT}/checkouts/${token}` }, userErrors: [] } } };
}

const opName = (query: string): string => /(?:mutation|query)\s+(\w+)/.exec(query)?.[1] ?? "";

async function adminGql(shop: Shop, query: string, variables: Record<string, unknown>): Promise<unknown> {
    const cat = await catalog(shop);
    const op = opName(query);
    const shopProducts = productsByShop.get(shop.domain) ?? new Map<string, StubProduct>();

    if (op === "ProductCreate") {
        const input = variables.product as { title: string; handle: string; descriptionHtml: string; status: string; tags: string[]; productOptions?: { name: string; values: { name: string }[] }[] };
        if ([...shopProducts.values()].some((p) => p.handle === input.handle)) {
            return { data: { productCreate: { product: null, userErrors: [{ field: ["handle"], message: "Handle has already been taken" }] } } };
        }
        const productId = nextId();
        const media = (variables.media as { originalSource: string }[] | undefined) ?? [];
        shopProducts.set(productId, { productId, handle: input.handle, title: input.title, bodyHtml: input.descriptionHtml, status: input.status.toLowerCase(), tags: input.tags, images: media.map((m) => m.originalSource) });
        // Shopify creates one standalone variant (first option value, or "Default Title").
        const standalone: Variant = {
            variantId: nextId(),
            productId,
            inventoryItemId: nextId(),
            sku: "",
            title: input.productOptions?.[0]?.values[0]?.name ?? "Default Title",
            productTitle: input.title,
            handle: input.handle,
            priceCents: 0,
            compareAtCents: null,
            qty: 0,
        };
        cat.push(standalone);
        setTimeout(() => void webhook(shop, "products/create", productPayload(shop, productId)), 30);
        return { data: { productCreate: { product: { id: gid("Product", productId), variants: { nodes: [{ id: gid("ProductVariant", standalone.variantId), inventoryItem: { id: gid("InventoryItem", standalone.inventoryItemId) } }] } }, userErrors: [] } } };
    }
    if (op === "VariantsCreate") {
        const productId = tail(String(variables.productId));
        const product = shopProducts.get(productId);
        if (!product) return { data: { productVariantsBulkCreate: { productVariants: [], userErrors: [{ message: "Product not found" }] } } };
        if (variables.strategy === "REMOVE_STANDALONE_VARIANT") {
            for (let i = cat.length - 1; i >= 0; i--) if (cat[i]?.productId === productId && cat[i]?.sku === "") cat.splice(i, 1);
        }
        const input = variables.variants as { optionValues: { name: string }[]; price: string; compareAtPrice: string | null; inventoryItem: { sku: string }; inventoryQuantities?: { availableQuantity: number }[] }[];
        if (input.some((v) => cat.some((c) => c.sku === v.inventoryItem.sku))) return { data: { productVariantsBulkCreate: { productVariants: [], userErrors: [{ message: "SKU already exists" }] } } };
        const created = input.map((v) => {
            const variant: Variant = {
                variantId: nextId(),
                productId,
                inventoryItemId: nextId(),
                sku: v.inventoryItem.sku,
                title: v.optionValues[0]?.name ?? "Default Title",
                productTitle: product.title,
                handle: product.handle,
                priceCents: Math.round(Number.parseFloat(v.price) * 100),
                compareAtCents: v.compareAtPrice ? Math.round(Number.parseFloat(v.compareAtPrice) * 100) : null,
                qty: v.inventoryQuantities?.[0]?.availableQuantity ?? 0,
            };
            cat.push(variant);
            return variant;
        });
        setTimeout(() => void webhook(shop, "products/update", productPayload(shop, productId)), 30);
        return { data: { productVariantsBulkCreate: { productVariants: created.map((v) => ({ id: gid("ProductVariant", v.variantId), sku: v.sku, inventoryItem: { id: gid("InventoryItem", v.inventoryItemId) } })), userErrors: [] } } };
    }
    if (op === "DefaultVariant") {
        const update = (variables.variants as { id: string; price: string; compareAtPrice: string | null; inventoryItem: { sku: string } }[])[0];
        const v = update ? cat.find((x) => x.variantId === tail(update.id)) : undefined;
        if (!v || !update) return { data: { productVariantsBulkUpdate: { userErrors: [{ message: "Variant not found" }] } } };
        v.sku = update.inventoryItem.sku;
        v.priceCents = Math.round(Number.parseFloat(update.price) * 100);
        v.compareAtCents = update.compareAtPrice ? Math.round(Number.parseFloat(update.compareAtPrice) * 100) : null;
        setTimeout(() => void webhook(shop, "products/update", productPayload(shop, v.productId)), 30);
        return { data: { productVariantsBulkUpdate: { productVariants: [{ id: update.id }], userErrors: [] } } };
    }
    if (op === "ProductOptions") {
        const id = tail(String(variables.id));
        const multi = cat.filter((v) => v.productId === id).length > 1;
        return { data: { product: { options: [{ name: multi ? "Shade" : "Title" }] } } };
    }
    if (op === "RenameOption") {
        const update = (variables.variants as { id: string; optionValues: { name: string }[] }[])[0];
        const v = update ? cat.find((x) => x.variantId === tail(update.id)) : undefined;
        if (!v || !update?.optionValues[0]) return { data: { productVariantsBulkUpdate: { userErrors: [{ message: "Variant not found" }] } } };
        v.title = update.optionValues[0].name;
        setTimeout(() => void webhook(shop, "products/update", productPayload(shop, v.productId)), 30);
        return { data: { productVariantsBulkUpdate: { productVariants: [{ id: update.id }], userErrors: [] } } };
    }
    if (op === "StagedUpload") {
        // Uploaded photos "become" a real Shopify CDN image so the storefront can render them.
        return { data: { stagedUploadsCreate: { stagedTargets: [{ url: `http://127.0.0.1:${PORT}/__staged/upload`, resourceUrl: STAGED_PHOTO, parameters: [{ name: "key", value: `tmp/${nextId()}` }] }], userErrors: [] } } };
    }
    if (op === "AttachPhoto") {
        const product = shopProducts.get(tail(String((variables.product as { id: string }).id)));
        if (!product) return { data: { productUpdate: { product: null, userErrors: [{ message: "Product not found" }] } } };
        for (const m of (variables.media as { originalSource: string }[] | undefined) ?? []) product.images.push(m.originalSource);
        return { data: { productUpdate: { product: { media: { nodes: [{ id: gid("MediaImage", nextId()) }] } }, userErrors: [] } } };
    }
    if (op === "CoverPhoto") {
        const product = shopProducts.get(tail(String(variables.id)));
        if (!product) return { data: { productReorderMedia: { userErrors: [{ message: "Product not found" }] } } };
        const last = product.images.pop();
        if (last) product.images.unshift(last);
        setTimeout(() => void webhook(shop, "products/update", productPayload(shop, product.productId)), 30);
        return { data: { productReorderMedia: { job: { id: gid("Job", nextId()) }, userErrors: [] } } };
    }
    if (op === "Publications") return { data: { publications: { nodes: [{ id: gid("Publication", "online-store") }] } } };
    if (op === "Publish") return { data: { publishablePublish: { userErrors: [] } } };
    if (op === "ProductUpdate") {
        const input = variables.product as { id: string; title?: string; descriptionHtml?: string; status?: string; tags?: string[] };
        const product = shopProducts.get(tail(input.id));
        if (!product) return { data: { productUpdate: { product: null, userErrors: [{ message: "Product not found" }] } } };
        if (input.title !== undefined) product.title = input.title;
        if (input.descriptionHtml !== undefined) product.bodyHtml = input.descriptionHtml;
        if (input.status !== undefined) product.status = input.status.toLowerCase();
        if (input.tags !== undefined) product.tags = input.tags;
        for (const m of (variables.media as { originalSource: string }[] | undefined) ?? []) product.images.push(m.originalSource);
        for (const v of cat) if (v.productId === product.productId) v.productTitle = product.title;
        setTimeout(() => void webhook(shop, "products/update", productPayload(shop, product.productId)), 30);
        return { data: { productUpdate: { product: { id: input.id }, userErrors: [] } } };
    }
    if (query.includes("productVariantsBulkUpdate")) {
        const updates = variables.variants as { id: string; price: string; compareAtPrice: string | null }[];
        for (const u of updates) {
            const v = cat.find((x) => x.variantId === tail(u.id));
            if (!v) return { data: { productVariantsBulkUpdate: { productVariants: [], userErrors: [{ field: ["variants"], message: "Variant not found" }] } } };
            v.priceCents = Math.round(Number.parseFloat(u.price) * 100);
            v.compareAtCents = u.compareAtPrice ? Math.round(Number.parseFloat(u.compareAtPrice) * 100) : null;
        }
        const productId = tail(String(variables.productId));
        setTimeout(() => void webhook(shop, "products/update", productPayload(shop, productId)), 50);
        return { data: { productVariantsBulkUpdate: { productVariants: updates.map((u) => ({ id: u.id, price: u.price })), userErrors: [] } } };
    }
    if (query.includes("inventorySetQuantities")) {
        const q = (variables.input as { quantities: { inventoryItemId: string; quantity: number }[] }).quantities[0];
        const v = q ? cat.find((x) => x.inventoryItemId === tail(q.inventoryItemId)) : undefined;
        if (!v || !q) return { data: { inventorySetQuantities: { userErrors: [{ message: "Inventory item not found" }] } } };
        v.qty = q.quantity;
        setTimeout(() => void webhook(shop, "inventory_levels/update", { inventory_item_id: Number(v.inventoryItemId), available: v.qty }), 50);
        return { data: { inventorySetQuantities: { userErrors: [] } } };
    }
    if (query.includes("productVariants")) {
        return {
            data: {
                productVariants: {
                    nodes: cat.map((v) => ({
                        id: gid("ProductVariant", v.variantId),
                        sku: v.sku,
                        title: v.title,
                        price: money(v.priceCents),
                        compareAtPrice: v.compareAtCents === null ? null : money(v.compareAtCents),
                        inventoryQuantity: v.qty,
                        inventoryItem: { id: gid("InventoryItem", v.inventoryItemId) },
                        product: { id: gid("Product", v.productId), title: v.productTitle, handle: v.handle, description: "", featuredMedia: null },
                    })),
                    pageInfo: { hasNextPage: false, endCursor: null },
                },
            },
        };
    }
    if (query.includes("refundCreate")) {
        const input = variables.input as { orderId: string; note: string; transactions: { amount: string; parentId: string }[]; refundLineItems: { lineItemId: string; quantity: number }[] };
        const order = orders.get(tail(input.orderId));
        const amount = Math.round(Number.parseFloat(input.transactions[0]?.amount ?? "0") * 100);
        if (!order) return { data: { refundCreate: { refund: null, userErrors: [{ message: "Order not found" }] } } };
        if (amount > order.totalCents - order.refundedCents) return { data: { refundCreate: { refund: null, userErrors: [{ message: "Refund exceeds refundable amount" }] } } };
        const refundId = nextId();
        order.refundedCents += amount;
        order.financialStatus = order.refundedCents >= order.totalCents ? "refunded" : "partially_refunded";
        bump(order);
        setTimeout(async () => {
            await webhook(shop, "refunds/create", {
                id: Number(refundId),
                order_id: Number(order.id),
                created_at: now(),
                processed_at: now(),
                note: input.note,
                refund_line_items: input.refundLineItems.map((r) => ({ quantity: r.quantity, line_item: { sku: order.lines.find((l) => l.id === tail(r.lineItemId))?.sku ?? null } })),
                transactions: [{ id: Number(nextId()), order_id: Number(order.id), kind: "refund", status: "success", gateway: "shopify_payments", amount: money(amount), currency: "USD", processed_at: now() }],
            });
            await webhook(shop, "orders/updated", orderPayload(order));
        }, 50);
        return { data: { refundCreate: { refund: { id: gid("Refund", refundId) }, userErrors: [] } } };
    }
    return { errors: [{ message: "stub: unsupported admin operation" }] };
}

// ─────────────────────────── Hosted checkout ───────────────────────────

const esc = (s: string): string => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);

async function checkoutPage(cart: Cart): Promise<string> {
    const cat = await catalog(cart.shop);
    const rows = cart.lines.map((l) => {
        const v = cat.find((x) => x.variantId === l.variantId);
        return { title: v ? `${v.productTitle}${v.title !== "Default Title" ? ` — ${v.title}` : ""}` : "Item", qty: l.quantity, cents: (v?.priceCents ?? 0) * l.quantity };
    });
    const total = rows.reduce((n, r) => n + r.cents, 0);
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Checkout — ${esc(cart.shop.domain)}</title>
<style>body{font-family:system-ui,sans-serif;background:#f6f6f7;margin:0;color:#202223}main{max-width:520px;margin:40px auto;background:#fff;border-radius:12px;padding:28px;box-shadow:0 1px 3px rgba(0,0,0,.1)}h1{font-size:20px}table{width:100%;border-collapse:collapse;margin:16px 0}td{padding:8px 0;border-bottom:1px solid #e1e3e5}td:last-child{text-align:right}label{display:block;font-size:13px;margin:16px 0 6px}input{width:100%;padding:10px;border:1px solid #8c9196;border-radius:6px;font-size:15px;box-sizing:border-box}button{margin-top:20px;width:100%;padding:14px;border:0;border-radius:8px;background:#5a31f4;color:#fff;font-size:16px;font-weight:600;cursor:pointer}.muted{color:#6d7175;font-size:13px}</style></head>
<body><main><p class="muted">${esc(cart.shop.domain)} · Shopify checkout (stub)</p><h1>Checkout</h1>
<table aria-label="Order summary">${rows.map((r) => `<tr><td>${esc(r.title)} × ${r.qty}</td><td>$${money(r.cents)}</td></tr>`).join("")}<tr><td><strong>Total</strong></td><td><strong data-testid="checkout-total">$${money(total)}</strong></td></tr></table>
<form method="post" action="/checkouts/${cart.token}/pay"><label for="email">Email</label><input id="email" name="email" type="email" required value="${esc(cart.email ?? "")}">
<label for="card">Card number (Shopify Payments)</label><input id="card" name="card" inputmode="numeric" value="4242 4242 4242 4242" required>
<button type="submit">Pay now</button></form></main></body></html>`;
}

async function pay(cart: Cart, email: string): Promise<string> {
    const cat = await catalog(cart.shop);
    const id = nextId();
    const createdAt = now();
    const lines = cart.lines.map((l) => {
        const v = cat.find((x) => x.variantId === l.variantId) as Variant;
        v.qty -= l.quantity;
        return { id: nextId(), sku: v.sku, title: v.productTitle, variantTitle: v.title === "Default Title" ? null : v.title, quantity: l.quantity, priceCents: v.priceCents, variantId: v.variantId };
    });
    const order: Order = {
        id,
        name: `#${orderNumber++}`,
        shop: cart.shop,
        email,
        lines,
        totalCents: lines.reduce((n, l) => n + l.priceCents * l.quantity, 0),
        refundedCents: 0,
        transactionId: nextId(),
        attributes: cart.attributes.map((a) => ({ name: a.key, value: a.value })),
        createdAt,
        updatedAt: createdAt,
        financialStatus: "pending",
        fulfillmentStatus: null,
    };
    orders.set(id, order);
    carts.delete(cart.token);

    // Same order Shopify uses: order created → payment captured → order paid.
    await webhook(cart.shop, "orders/create", orderPayload(order));
    await webhook(cart.shop, "order_transactions/create", {
        id: Number(order.transactionId),
        order_id: Number(id),
        kind: "sale",
        status: "success",
        gateway: "shopify_payments",
        amount: money(order.totalCents),
        currency: "USD",
        processed_at: now(),
    });
    order.financialStatus = "paid";
    bump(order);
    await webhook(cart.shop, "orders/paid", orderPayload(order));
    const slug = order.attributes.find((a) => a.name === "storefront")?.value ?? cart.shop.slug;
    return `${STOREFRONT}/${slug}/account?placed=${encodeURIComponent(order.name)}`;
}

// ─────────────────────────── HTTP ───────────────────────────

async function readBody(req: IncomingMessage): Promise<string> {
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    return Buffer.concat(chunks).toString("utf8");
}

function send(res: ServerResponse, status: number, body: unknown, type = "application/json"): void {
    res.writeHead(status, { "content-type": type });
    res.end(type === "application/json" ? JSON.stringify(body) : String(body));
}

const server = createServer(async (req, res) => {
    try {
        const url = new URL(req.url ?? "/", `http://127.0.0.1:${PORT}`);
        const parts = url.pathname.split("/").filter(Boolean);

        if (req.method === "POST" && parts[0] === "shops" && parts[parts.length - 1] === "graphql.json") {
            const shop = SHOPS.find((s) => s.domain === parts[1]);
            if (!shop) return send(res, 404, { errors: [{ message: "Unknown shop" }] });
            const { query, variables } = JSON.parse(await readBody(req)) as { query: string; variables: Record<string, unknown> };
            if (parts[2] === "admin") {
                if (req.headers["x-shopify-access-token"] !== shop.adminToken) return send(res, 401, { errors: [{ message: "Invalid API key or access token" }] });
                return send(res, 200, await adminGql(shop, query, variables));
            }
            if (req.headers["x-shopify-storefront-access-token"] !== shop.storefrontToken) return send(res, 401, { errors: [{ message: "Unauthorized" }] });
            return send(res, 200, await storefrontGql(shop, query, variables));
        }

        if (req.method === "POST" && url.pathname === "/__staged/upload") {
            await readBody(req);
            return send(res, 201, {});
        }

        if (parts[0] === "checkouts" && parts[1]) {
            const cart = carts.get(parts[1]);
            if (!cart) return send(res, 404, "<p>This checkout has expired.</p>", "text/html");
            if (req.method === "GET") return send(res, 200, await checkoutPage(cart), "text/html; charset=utf-8");
            if (req.method === "POST" && parts[2] === "pay") {
                const form = new URLSearchParams(await readBody(req));
                const email = (form.get("email") ?? "").trim().toLowerCase();
                if (!email.includes("@")) return send(res, 400, "<p>Email required</p>", "text/html");
                const redirect = await pay(cart, email);
                res.writeHead(303, { location: redirect });
                return res.end();
            }
        }

        if (req.method === "POST" && parts[0] === "__control" && parts[2] === "orders" && parts[4] === "fulfill") {
            const shop = SHOPS.find((s) => s.domain === parts[1]);
            const order = orders.get(parts[3] ?? "");
            if (!shop || !order) return send(res, 404, { error: "not found" });
            order.fulfillmentStatus = "fulfilled";
            bump(order);
            await webhook(shop, "fulfillments/create", { id: Number(nextId()), order_id: Number(order.id), status: "success", tracking_company: "UPS", tracking_number: `1Z${order.id.slice(-8)}`, tracking_url: "https://www.ups.com/track", created_at: now() });
            await webhook(shop, "orders/fulfilled", orderPayload(order));
            return send(res, 200, { ok: true });
        }

        // Simulates a merchant creating a product in Shopify's own admin (→ products/create webhook).
        if (req.method === "POST" && parts[0] === "__control" && parts[2] === "products") {
            const shop = SHOPS.find((s) => s.domain === parts[1]);
            if (!shop) return send(res, 404, { error: "unknown shop" });
            const input = JSON.parse(await readBody(req)) as { title: string; handle: string; tags: string[]; priceCents: number; options: string[]; skuPrefix: string; image?: string };
            const cat = await catalog(shop);
            const productId = nextId();
            (productsByShop.get(shop.domain) ?? new Map()).set(productId, { productId, handle: input.handle, title: input.title, bodyHtml: `<p>${input.title}</p>`, status: "active", tags: input.tags, images: input.image ? [input.image] : [] });
            for (const option of input.options) {
                cat.push({ variantId: nextId(), productId, inventoryItemId: nextId(), sku: `${input.skuPrefix}:${option}`, title: option, productTitle: input.title, handle: input.handle, priceCents: input.priceCents, compareAtCents: null, qty: 25 });
            }
            const status = await webhook(shop, "products/create", productPayload(shop, productId));
            return send(res, 200, { productId, webhookStatus: status });
        }

        if (req.method === "GET" && url.pathname === "/__control/orders") {
            return send(res, 200, { items: [...orders.values()].map((o) => ({ id: o.id, name: o.name, shop: o.shop.domain, email: o.email, financialStatus: o.financialStatus })) });
        }
        if (req.method === "GET" && url.pathname === "/health") return send(res, 200, { status: "ok" });
        send(res, 404, { error: "not found" });
    } catch (err) {
        console.error("[stub]", err);
        send(res, 500, { errors: [{ message: err instanceof Error ? err.message : "stub error" }] });
    }
});

server.listen(PORT, "127.0.0.1", () => console.info(`[stub] Shopify stub on http://127.0.0.1:${PORT} (${SHOPS.map((s) => s.domain).join(", ")})`));
