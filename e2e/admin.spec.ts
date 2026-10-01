import { expect, test } from "@playwright/test";
import { E2E_ADMIN, E2E_WEB, loginAdmin, payOnShopifyStub, uniqueEmail } from "./helpers";

test.describe.configure({ mode: "serial" });

const login = loginAdmin;

test("Admin sees a Shopify order with its Shopify Payments transaction", async ({ page }) => {
    // Place a fresh order through the storefront → Shopify checkout → webhooks.
    const email = uniqueEmail("admin-view");
    await page.goto("/fashion");
    await page.locator("#shop").getByRole("button", { name: /Add size M: Heavyweight Tee/ }).click();
    await page.getByRole("dialog", { name: "Your bag" }).getByRole("button", { name: "Checkout securely" }).click();
    await payOnShopifyStub(page, email);
    await page.waitForURL(/\/fashion\/account\?placed=/);
    const placed = decodeURIComponent(new URL(page.url()).searchParams.get("placed") ?? "");

    await login(page);
    await expect(page.getByRole("heading", { name: /ICP comparison/ })).toBeVisible();
    for (const store of ["VELOUR", "Maison Noor", "ATELIER NORD"]) await expect(page.getByRole("cell", { name: store })).toBeVisible();

    await page.goto(`${E2E_ADMIN}/admin/orders?store=fashion`);
    await page.getByRole("link", { name: placed, exact: true }).click();
    const txns = page.getByRole("region", { name: "Transactions" });
    await expect(txns.getByText("Shopify Payments")).toBeVisible();
    await expect(page.getByRole("region", { name: "Timeline" }).getByText(/Payment status: paid/)).toBeVisible();
});

test("Page builder: disabling a section removes it from the live storefront", async ({ page }) => {
    await login(page);
    await page.goto(`${E2E_ADMIN}/admin/pages?store=beauty`);
    const values = page.getByRole("listitem").filter({ hasText: "Values" });
    const enabled = values.getByRole("checkbox", { name: "Enabled" });
    // Normalise: start from "enabled" even if an earlier interrupted run left it off.
    if (!(await enabled.isChecked())) {
        await enabled.click();
        await expect(enabled).toBeChecked();
    }
    // Optimistic update lands right after the click (after cancelQueries) — assert with auto-retry.
    await enabled.click();
    await expect(enabled).not.toBeChecked();
    try {
        await expect.poll(async () => {
            const res = await page.request.get("/beauty");
            return (await res.text()).includes("Color, but make it kind.");
        }, { timeout: 20_000 }).toBe(false);
    } finally {
        await enabled.click();
        await expect(enabled).toBeChecked();
    }
});

test("Inline editor: an admin edits storefront text in place and visitors see it", async ({ page, browser }) => {
    await login(page);
    await page.goto(`${E2E_ADMIN}/beauty`);
    await page.getByRole("button", { name: "Edit page" }).click();
    const eyebrow = page.locator('[data-edit$=":A:eyebrow"]').first();
    const original = (await eyebrow.getAttribute("data-edit-value")) ?? "";
    const next = `Edited in place ${Date.now()}`;
    await eyebrow.click();
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.type(next);
    await expect(page.getByRole("region", { name: "Page editor" })).toContainText("1 unpublished change");
    await Promise.all([page.waitForEvent("load"), page.getByRole("button", { name: "Publish" }).click()]);

    // A visitor (no admin session) gets the new copy, without editor markup.
    const visitor = await (await browser.newContext()).newPage();
    await visitor.goto("/beauty");
    await expect(visitor.getByText(next, { exact: true })).toBeVisible();
    await expect(visitor.locator("[data-edit]")).toHaveCount(0);
    await expect(visitor.getByRole("button", { name: "Edit page" })).toHaveCount(0);

    // Put the original copy back.
    await page.getByRole("button", { name: "Edit page" }).click();
    await page.locator('[data-edit$=":A:eyebrow"]').first().click();
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.type(original);
    await Promise.all([page.waitForEvent("load"), page.getByRole("button", { name: "Publish" }).click()]);
    await expect(page.locator('[data-edit$=":A:eyebrow"]').first()).toHaveAttribute("data-edit-value", original);
});

test("Admin surfaces exist only on the admin address", async ({ page, request }) => {
    // Public brand domain: no console, no admin API, no editor — even for a signed-in admin.
    expect((await request.get(`${E2E_WEB}/admin/login`)).status()).toBe(404);
    expect((await request.get(`${E2E_WEB}/api/v1/admin/me`)).status()).toBe(404);
    await loginAdmin(page);
    await page.goto(`${E2E_WEB}/beauty`);
    await expect(page.getByRole("button", { name: "Edit page" })).toHaveCount(0);
    await expect(page.locator("[data-edit]")).toHaveCount(0);
    // Admin address: the root opens the console and the storefront is editable.
    await page.goto(`${E2E_ADMIN}/`);
    await expect(page).toHaveURL(/\/admin/);
    await page.goto(`${E2E_ADMIN}/beauty`);
    await expect(page.getByRole("button", { name: "Edit page" })).toBeVisible();
});
