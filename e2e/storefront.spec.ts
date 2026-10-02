import { expect, test } from "@playwright/test";
import { adminApi, payOnShopifyStub, pickFirstSlot, signIn, uniqueEmail } from "./helpers";

test.describe.configure({ mode: "serial" });

test("VELOUR: add to bag → Shopify checkout (Shopify Payments) → customer sees the paid transaction", async ({ page }) => {
    const email = uniqueEmail("velour");
    await page.goto("/beauty");
    await page.locator("#shade-finder").getByRole("button", { name: /Add: Velvet Lip/ }).first().click();
    const drawer = page.getByRole("dialog", { name: "Your bag" });
    await expect(drawer).toBeVisible();
    await drawer.getByRole("button", { name: "Checkout securely" }).click();

    await payOnShopifyStub(page, email);
    await page.waitForURL(/\/beauty\/account\?placed=/);
    await expect(page.getByText(/Thank you — order #\d+ is placed/)).toBeVisible();
    // The purchased bag is cleared once Shopify hands the shopper back.
    await expect(page.getByRole("button", { name: "Open bag, 0 items" })).toBeVisible();

    await signIn(page, "beauty", email);
    const order = page.getByRole("article").first();
    await expect(order.getByText("Paid", { exact: true })).toBeVisible();
    // The just-placed order opens its payments panel automatically.
    await expect(order.getByRole("cell", { name: "Shopify Payments" })).toBeVisible();
    await expect(order.getByRole("cell", { name: "Success" })).toBeVisible();
});

test("VELOUR: bundle builder checks out as one validated set", async ({ page }) => {
    await page.goto("/beauty#edit");
    const edit = page.locator("#edit");
    for (const name of ["Second-Skin Tint", "Lift Mascara", "Dew Glow Balm"]) await edit.getByRole("button", { name: new RegExp(name) }).click();
    await edit.getByRole("button", { name: "Add the set to bag" }).click();
    const drawer = page.getByRole("dialog", { name: "Your bag" });
    await expect(drawer.getByText("The Everyday Edit")).toBeVisible();
    await drawer.getByRole("button", { name: "Checkout securely" }).click();
    await page.waitForURL(/127\.0\.0\.1:8099\/checkouts\//);
    await expect(page.getByTestId("checkout-total")).toHaveText("$65.00");
});

test("Admin price change is pushed to Shopify and shows on the storefront", async ({ page }) => {
    const admin = await adminApi();
    const { items } = (await admin.call("GET", "/products", "beauty")) as { items: { variants: { id: string; sku: string; priceCents: number }[] }[] };
    const variant = items.flatMap((p) => p.variants).find((v) => v.sku === "velvet-lip-mauve-muse");
    expect(variant).toBeTruthy();
    const original = variant?.priceCents ?? 2800;
    try {
        const res = (await admin.call("PATCH", `/variants/${variant?.id}`, "beauty", { priceCents: 3300 })) as { pushedToShopify: boolean };
        expect(res.pushedToShopify).toBe(true);
        await expect.poll(async () => {
            await page.goto("/beauty");
            return page.locator("#velvet-lip-mauve-muse").innerText();
        }).toContain("$33");
    } finally {
        await admin.call("PATCH", `/variants/${variant?.id}`, "beauty", { priceCents: original });
        await admin.ctx.dispose();
    }
});

test("Page builder copy + A/B variant render on the storefront", async ({ page }) => {
    const admin = await adminApi();
    const { items } = (await admin.call("GET", "/pages", "fashion")) as { items: { sections: { id: string; type: string; props: Record<string, string> }[] }[] };
    const hero = items[0]?.sections.find((s) => s.type === "fashion.hero");
    expect(hero).toBeTruthy();
    const original = hero?.props ?? {};
    try {
        // 100% of visitors see variant B → deterministic.
        await admin.call("PATCH", `/sections/${hero?.id}`, "fashion", { props: { ...original, tagline: "Variant A tagline" }, variantBProps: { ...original, tagline: "Built to be repaired, not replaced." }, abSplit: 100 });
        await expect.poll(async () => {
            await page.goto("/fashion");
            return page.locator("body").innerText();
        }).toContain("Built to be repaired, not replaced.");
    } finally {
        await admin.call("PATCH", `/sections/${hero?.id}`, "fashion", { props: original, variantBProps: null, abSplit: 0 });
        await admin.ctx.dispose();
    }
});

test("Maison Noor: book a no-deposit service online", async ({ page }) => {
    await page.goto("/salon");
    const widget = page.locator("#book");
    // The day picker renders after hydration — interacting earlier would be reset by React.
    await expect(widget.getByRole("radiogroup", { name: "Day" })).toBeVisible();
    await widget.getByLabel("Service").selectOption("blowout");
    await pickFirstSlot(widget);
    await widget.getByRole("textbox", { name: "Your name" }).fill("E2E Client");
    await widget.getByRole("textbox", { name: "Email", exact: true }).fill(uniqueEmail("salon"));
    await widget.getByRole("button", { name: "Reserve" }).click();
    await expect(page.getByText(/You're booked: Blow-dry bar/)).toBeVisible();
});

test("Maison Noor: deposit booking is paid on Shopify and confirmed by webhook", async ({ page }) => {
    const email = uniqueEmail("deposit");
    await page.goto("/salon");
    const widget = page.locator("#book");
    // The day picker renders after hydration — interacting earlier would be reset by React.
    await expect(widget.getByRole("radiogroup", { name: "Day" })).toBeVisible();
    await widget.getByLabel("Service").selectOption("balayage");
    await pickFirstSlot(widget);
    await widget.getByRole("textbox", { name: "Your name" }).fill("Deposit Client");
    await widget.getByRole("textbox", { name: "Email", exact: true }).fill(email);
    await widget.getByRole("button", { name: "Hold & pay deposit" }).click();

    await payOnShopifyStub(page, email);
    await page.waitForURL(/\/salon\/account\?placed=/);
    await signIn(page, "salon", email);
    const appointments = page.getByRole("region", { name: "Appointments" });
    await expect(appointments.getByText("Hand-painted balayage")).toBeVisible();
    await expect(appointments.getByText("Confirmed", { exact: true })).toBeVisible();
});

test("Storefronts ship SEO essentials", async ({ page }) => {
    // VELOUR has a brand domain in the e2e stack, so its canonical is that domain's root.
    for (const [path, type, canonical] of [["/beauty", "ItemList", /^https?:\/\/velour\.localhost:3031\/?$/], ["/salon", "HairSalon", /\/salon$/], ["/fashion", "ItemList", /\/fashion$/]] as const) {
        await page.goto(path);
        await expect(page).toHaveTitle(/.{20,}/);
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", canonical);
        const ld = await page.locator('script[type="application/ld+json"]').allInnerTexts();
        expect(ld.some((j) => j.includes(`"@type":"${type}"`))).toBe(true);
    }
    await page.goto("/beauty/journal/find-your-undertone");
    const ld = await page.locator('script[type="application/ld+json"]').allInnerTexts();
    expect(ld.some((j) => j.includes('"@type":"Article"'))).toBe(true);
});

test("@mobile storefronts have no horizontal overflow on phones", async ({ page }) => {
    for (const path of ["/", "/beauty", "/salon", "/fashion", "/beauty/account"]) {
        await page.goto(path);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, path).toBeLessThanOrEqual(1);
    }
});

test("Brand domains serve their store at the root", async ({ request }) => {
    const brand = "http://velour.localhost:3031";
    const home = await request.get(`${brand}/`);
    expect(home.status()).toBe(200);
    expect(await home.text()).toContain("VELOUR");
    expect((await request.get(`${brand}/journal`)).status()).toBe(200);
    const legacy = await request.get(`${brand}/beauty/journal`, { maxRedirects: 0 });
    expect(legacy.status()).toBe(308);
    expect(legacy.headers()["location"]).toMatch(/\/journal$/);
    expect((await request.get(`${brand}/admin/login`)).status()).toBe(404);
});
