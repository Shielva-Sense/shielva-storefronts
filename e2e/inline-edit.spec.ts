import { expect, test, type Page } from "@playwright/test";
import { adminApi, E2E_ADMIN, loginAdmin } from "./helpers";

test.describe.configure({ mode: "serial" });

const PNG_1PX = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

async function editField(page: Page, selector: string, text: string): Promise<void> {
    const el = page.locator(selector).first();
    await el.click();
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.type(text);
}

async function publish(page: Page): Promise<void> {
    await Promise.all([page.waitForEvent("load", { timeout: 20_000 }), page.getByRole("button", { name: "Publish" }).click()]);
}

test.afterAll(async () => {
    // Restore the default menu + footer for other specs.
    const admin = await adminApi();
    await admin.call("PUT", "/site", "beauty", { nav: null, footer: null });
    await admin.ctx.dispose();
});

test("Inline editor: a price edited on the page is pushed to Shopify and shown to visitors", async ({ page, browser }) => {
    await loginAdmin(page);
    await page.goto(`${E2E_ADMIN}/beauty`);
    await page.getByRole("button", { name: "Edit page" }).click();
    const price = '[data-edit="variant:velvet-lip-ruby-noir:price"]';
    const original = (await page.locator(price).first().getAttribute("data-edit-value")) ?? "28";
    await editField(page, price, "31");
    await expect(page.getByRole("region", { name: "Page editor" })).toContainText("1 unpublished change");
    await publish(page);

    const visitor = await (await browser.newContext()).newPage();
    await expect.poll(async () => {
        await visitor.goto("/beauty");
        return visitor.locator("#velvet-lip-ruby-noir").innerText();
    }, { timeout: 30_000 }).toContain("$31");

    await page.goto(`${E2E_ADMIN}/beauty`);
    await page.getByRole("button", { name: "Edit page" }).click();
    await editField(page, price, original);
    await publish(page);
});

test("Inline editor: footer text and the menu are editable in place", async ({ page, browser }) => {
    await loginAdmin(page);
    await page.goto(`${E2E_ADMIN}/beauty`);
    await page.getByRole("button", { name: "Edit page" }).click();
    await editField(page, '[data-edit="site:footer.tagline"]', "Every tone, every day.");
    await publish(page);

    await page.getByRole("button", { name: "Edit page" }).click();
    await page.getByRole("button", { name: "Menu & footer" }).click();
    const dialog = page.getByRole("dialog", { name: "Menu & footer" });
    await dialog.getByLabel("Label").first().fill("Find your shade");
    await dialog.getByRole("button", { name: "Add menu link" }).click();
    await dialog.getByLabel("Label").nth(4).fill("Journal");
    await dialog.getByLabel("Link").nth(4).fill("/beauty/journal");
    await Promise.all([page.waitForEvent("load"), dialog.getByRole("button", { name: "Save menu & footer" }).click()]);

    const visitor = await (await browser.newContext()).newPage();
    await visitor.goto("/beauty");
    const nav = visitor.getByRole("navigation", { name: "VELOUR sections" });
    await expect(nav.getByRole("link", { name: "Find your shade" })).toHaveAttribute("href", "#shade-finder");
    await expect(nav.getByRole("link", { name: "Journal" })).toHaveAttribute("href", "/beauty/journal");
    await expect(visitor.getByText("Every tone, every day.")).toBeVisible();
    // Bad links are refused before saving.
    await page.getByRole("button", { name: "Edit page" }).click();
    await page.getByRole("button", { name: "Menu & footer" }).click();
    await page.getByRole("dialog", { name: "Menu & footer" }).getByLabel("Link").first().fill("javascript:alert(1)");
    await expect(page.getByRole("dialog", { name: "Menu & footer" }).getByRole("button", { name: "Save menu & footer" })).toBeDisabled();
});

test("Inline editor: clicking a product photo uploads a new cover to Shopify", async ({ page, browser }) => {
    await loginAdmin(page);
    await page.goto(`${E2E_ADMIN}/beauty#edit`);
    await page.getByRole("button", { name: "Edit page" }).click();
    const chooser = page.waitForEvent("filechooser");
    await page.locator('#edit [data-edit-media="mascara"]').click();
    await (await chooser).setFiles({ name: "mascara.png", mimeType: "image/png", buffer: PNG_1PX });
    await expect(page.getByText("Photo uploaded to Shopify")).toBeVisible();

    const visitor = await (await browser.newContext()).newPage();
    await expect.poll(async () => {
        await visitor.goto("/beauty");
        return visitor.locator('#edit img[src*="placeholder-images"]').count();
    }, { timeout: 30_000 }).toBeGreaterThan(0);
});

test("Inline editor: shade names, list items and button labels are editable in place", async ({ page, browser }) => {
    await loginAdmin(page);
    await page.goto(`${E2E_ADMIN}/beauty`);
    await page.getByRole("button", { name: "Edit page" }).click();
    const name = '[data-edit="variant:velvet-lip-ruby-noir:option"]';
    await editField(page, name, "Ruby Noir Deluxe");
    const firstTicker = page.locator('[data-edit$=":items#0"]').first();
    const tickerOriginal = (await firstTicker.getAttribute("data-edit-value")) ?? "";
    await editField(page, '[data-edit$=":items#0"]', "Ships free over $35");
    await editField(page, '[data-edit="site:labels.newsletterCta"]', "Join the list");
    await expect(page.getByRole("region", { name: "Page editor" })).toContainText("3 unpublished changes");
    await publish(page);

    const visitor = await (await browser.newContext()).newPage();
    await expect.poll(async () => {
        await visitor.goto("/beauty");
        return visitor.locator("#velvet-lip-ruby-noir").innerText();
    }, { timeout: 30_000 }).toContain("Ruby Noir Deluxe");
    await expect(visitor.getByRole("region", { name: "Why VELOUR" }).getByText("Ships free over $35").first()).toBeVisible();
    await expect(visitor.getByRole("button", { name: "Join the list" })).toBeVisible();

    // Restore the shade name and ticker item.
    await page.goto(`${E2E_ADMIN}/beauty`);
    await page.getByRole("button", { name: "Edit page" }).click();
    await editField(page, name, "Ruby Noir");
    await editField(page, '[data-edit$=":items#0"]', tickerOriginal);
    await publish(page);
});

test("Inline editor: sections can be hidden and reordered from the page", async ({ page, browser }) => {
    await loginAdmin(page);
    await page.goto(`${E2E_ADMIN}/beauty`);
    await page.getByRole("button", { name: "Edit page" }).click();
    await page.getByRole("button", { name: "Sections" }).click();
    const dialog = page.getByRole("dialog", { name: "Sections" });
    await dialog.getByRole("checkbox", { name: "Values" }).uncheck();
    await Promise.all([page.waitForEvent("load"), dialog.getByRole("button", { name: "Save sections" }).click()]);

    const visitor = await (await browser.newContext()).newPage();
    await visitor.goto("/beauty");
    await expect(visitor.getByText("Color, but make it kind.")).toHaveCount(0);

    await page.getByRole("button", { name: "Edit page" }).click();
    await page.getByRole("button", { name: "Sections" }).click();
    await page.getByRole("dialog", { name: "Sections" }).getByRole("checkbox", { name: "Values" }).check();
    await Promise.all([page.waitForEvent("load"), page.getByRole("dialog", { name: "Sections" }).getByRole("button", { name: "Save sections" }).click()]);
});

test("Inline editor: attributes take only allowed values; templates and numbers stay live", async ({ page, browser }) => {
    await loginAdmin(page);
    await page.goto(`${E2E_ADMIN}/beauty`);
    await page.getByRole("button", { name: "Edit page" }).click();
    const finish = '[data-edit="attribute:velvet-lip-ruby-noir:finish"]';
    const finishBefore = (await page.locator(finish).first().getAttribute("data-edit-value")) ?? "Velvet matte";

    await editField(page, finish, "Glitter");
    await expect(page.getByRole("region", { name: "Page editor" })).toContainText("Fix the highlighted field");
    await expect(page.getByRole("button", { name: "Publish" })).toBeDisabled();
    await editField(page, finish, "satin");
    await editField(page, '[data-edit$=":A:eyebrow"][data-edit-value*="{price}"]', "Lipsticks from {price}");
    await publish(page);

    const visitor = await (await browser.newContext()).newPage();
    await expect.poll(async () => {
        await visitor.goto("/beauty");
        return visitor.locator("#velvet-lip-ruby-noir").innerText();
    }, { timeout: 30_000 }).toContain("Satin");
    await expect(visitor.getByText(/Lipsticks from \$\d+/)).toBeVisible();

    // ATELIER NORD: a true-cost amount is edited as a plain number and shown as money.
    await page.goto(`${E2E_ADMIN}/fashion`);
    await page.getByRole("button", { name: "Edit page" }).click();
    await editField(page, '[data-edit$=":A:line1Amount"]', "130");
    await publish(page);
    await visitor.goto("/fashion");
    await expect(visitor.locator("#pricing")).toContainText("$130");

    // Restore.
    await page.goto(`${E2E_ADMIN}/beauty`);
    await page.getByRole("button", { name: "Edit page" }).click();
    await editField(page, finish, finishBefore);
    await editField(page, '[data-edit$=":A:eyebrow"][data-edit-value*="{price}"]', "Lip color · from {price}");
    await publish(page);
});
