import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, request, type APIRequestContext, type Locator, type Page } from "@playwright/test";

const API_ENV = path.resolve(process.cwd(), "../shielva-storefronts-api/.env.e2e");

/** The isolated e2e stack — never the dev servers (3030 / 8040), which talk to real Shopify. */
export const E2E_WEB = "http://localhost:3031";
/** The admin address (ADMIN_HOSTS): console, admin API and in-place editor exist only here. */
export const E2E_ADMIN = "http://admin.localhost:3031";
export const E2E_API = "http://127.0.0.1:8041";

function apiEnv(): Record<string, string> {
    return Object.fromEntries(
        readFileSync(API_ENV, "utf8")
            .split("\n")
            .filter((l) => l.includes("=") && !l.startsWith("#"))
            .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
    );
}

export const ADMIN = { email: apiEnv().SEED_ADMIN_EMAIL ?? "", password: apiEnv().SEED_ADMIN_PASSWORD ?? "" };
export const uniqueEmail = (tag: string): string => `${tag}.${Date.now()}.${Math.floor(Math.random() * 1e4)}@e2e.test`;

/** Sign the browser into the admin console (cookie is then sent on storefront pages too). */
export async function loginAdmin(page: Page): Promise<void> {
    await page.goto(`${E2E_ADMIN}/admin/login`);
    await page.getByRole("textbox", { name: "Email" }).fill(ADMIN.email);
    await page.getByLabel("Password").fill(ADMIN.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Dashboard" })).toBeVisible();
}

/** Admin API session (through the Next proxy, exactly like the browser). */
export async function adminApi(): Promise<{ ctx: APIRequestContext; call: (method: string, path: string, store: string, body?: unknown) => Promise<unknown> }> {
    const ctx = await request.newContext({ baseURL: E2E_ADMIN });
    await ctx.get("/api/v1/session");
    const csrf = async (): Promise<string> => (await ctx.storageState()).cookies.find((c) => c.name === "sf_csrf")?.value ?? "";
    const login = await ctx.post("/api/v1/admin/login", { data: ADMIN, headers: { "x-csrf-token": await csrf() } });
    expect(login.ok(), await login.text()).toBeTruthy();
    const call = async (method: string, path: string, store: string, body?: unknown): Promise<unknown> => {
        const res = await ctx.fetch(`/api/v1/admin${path}`, { method, headers: { "x-tenant": store, "x-csrf-token": await csrf() }, ...(body !== undefined ? { data: body } : {}) });
        expect(res.ok(), `${method} ${path}: ${await res.text()}`).toBeTruthy();
        return res.json();
    };
    return { ctx, call };
}

/** Reads the sign-in code from the dev-only mailbox (loopback-only API route). */
export async function readOtp(store: string, email: string): Promise<string> {
    const ctx = await request.newContext({ baseURL: E2E_API });
    for (let i = 0; i < 20; i++) {
        const res = await ctx.get(`/api/v1/dev/outbox?email=${encodeURIComponent(email)}`, { headers: { "x-storefront": store } });
        const items = ((await res.json()) as { items: { kind: string; subject: string }[] }).items;
        const code = /\d{6}/.exec(items.find((m) => m.kind === "otp")?.subject ?? "")?.[0];
        if (code) {
            await ctx.dispose();
            return code;
        }
        await new Promise((r) => setTimeout(r, 250));
    }
    throw new Error("no OTP email");
}

export async function signIn(page: Page, store: string, email: string): Promise<void> {
    await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
    await page.getByRole("button", { name: "Email me a code" }).click();
    const code = await readOtp(store, email);
    await page.getByRole("textbox", { name: "6-digit code" }).fill(code);
    await page.getByRole("button", { name: "Sign in" }).click();
}

export async function payOnShopifyStub(page: Page, email: string): Promise<void> {
    await page.waitForURL(/127\.0\.0\.1:8099\/checkouts\//);
    await page.getByRole("textbox", { name: "Email" }).fill(email);
    await page.getByRole("button", { name: "Pay now" }).click();
}

/** Walks the day picker until a day with open slots appears, then picks the first slot. */
export async function pickFirstSlot(widget: Locator): Promise<void> {
    const days = widget.getByRole("radiogroup", { name: "Day" }).getByRole("radio");
    const count = await days.count();
    for (let i = 1; i < count; i++) {
        await days.nth(i).click();
        const first = widget.getByRole("radiogroup", { name: "Time" }).getByRole("radio").first();
        const open = await first.waitFor({ state: "visible", timeout: 5000 }).then(() => true, () => false);
        if (open) {
            await first.click();
            return;
        }
    }
    throw new Error("no open slots in the next week");
}
