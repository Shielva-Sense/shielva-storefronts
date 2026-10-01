import { expect, request, test } from "@playwright/test";
import { adminApi, payOnShopifyStub } from "./helpers";

test.describe.configure({ mode: "serial" });

const run = Date.now().toString(36);

test("A product created in our admin (→ Shopify) appears in VELOUR's shade rail and can be bought", async ({ page }) => {
    const admin = await adminApi();
    const handle = `e2e-gloss-${run}`;
    const sku = `${handle}-midnight-cherry`;
    const created = (await admin.call("POST", "/products", "beauty", {
        handle,
        title: "Lacquer Gloss",
        description: "High-shine gloss.",
        status: "active",
        tags: ["lip"],
        optionName: "Shade",
        variants: [
            { sku, option: "Midnight Cherry", priceCents: 2400, inventoryQty: 25, attributes: { swatch: "#5a0f23", finish: "Glaze", undertone: "cool", bestFor: "medium,tan,deep,rich" } },
            { sku: `${handle}-peach-glow`, option: "Peach Glow", priceCents: 2400, inventoryQty: 25, attributes: { swatch: "#f0a07e", finish: "Glaze", undertone: "warm", bestFor: "fair,light" } },
        ],
    })) as { id: string };
    try {
        await expect.poll(async () => {
            await page.goto("/beauty");
            return page.locator(`[id="${sku}"]`).count();
        }, { timeout: 20_000 }).toBe(1);
        const card = page.locator(`[id="${sku}"]`);
        await expect(card.getByText("Midnight Cherry")).toBeVisible();
        await expect(card.getByText("$24")).toBeVisible();

        await card.getByRole("button", { name: /Add: Lacquer Gloss, Midnight Cherry/ }).click();
        await page.getByRole("dialog", { name: "Your bag" }).getByRole("button", { name: "Checkout securely" }).click();
        await page.waitForURL(/127\.0\.0\.1:8099\/checkouts\//);
        await expect(page.getByText(/Lacquer Gloss — Midnight Cherry/)).toBeVisible();
        await expect(page.getByTestId("checkout-total")).toHaveText("$24.00");
        await payOnShopifyStub(page, `buyer.${run}@e2e.test`);
        await page.waitForURL(/\/beauty\/account\?placed=/);
    } finally {
        await admin.call("PATCH", `/products/${created.id}`, "beauty", { status: "archived" });
        await admin.ctx.dispose();
    }
});

test("A product created directly in Shopify appears on ATELIER NORD automatically", async ({ page }) => {
    const handle = `e2e-beanie-${run}`;
    const stub = await request.newContext({ baseURL: "http://127.0.0.1:8099" });
    const res = await stub.post("/__control/atelier-nord-demo.myshopify.com/products", {
        data: { title: "Cashmere Beanie", handle, tags: ["permanent"], priceCents: 6500, options: ["S", "M", "L"], skuPrefix: handle },
    });
    expect(res.ok()).toBeTruthy();
    expect((await res.json()).webhookStatus).toBe(200);
    await stub.dispose();

    const admin = await adminApi();
    try {
        await expect.poll(async () => {
            await page.goto("/fashion");
            return page.locator(`#${handle}`).count();
        }, { timeout: 20_000 }).toBe(1);
        const card = page.locator(`#${handle}`);
        await expect(card.getByText("Cashmere Beanie")).toBeVisible();
        await expect(card.getByText("$65")).toBeVisible();
        // It's purchasable straight away — Shopify variant ids came with the webhook.
        await card.getByRole("button", { name: /Add size M: Cashmere Beanie/ }).click();
        await page.getByRole("dialog", { name: "Your bag" }).getByRole("button", { name: "Checkout securely" }).click();
        await page.waitForURL(/127\.0\.0\.1:8099\/checkouts\//);
        await expect(page.getByTestId("checkout-total")).toHaveText("$65.00");
    } finally {
        const { items } = (await admin.call("GET", "/products", "fashion")) as { items: { id: string; handle: string }[] };
        const beanie = items.find((p) => p.handle === handle);
        if (beanie) await admin.call("PATCH", `/products/${beanie.id}`, "fashion", { status: "archived" });
        await admin.ctx.dispose();
    }
});
