import { defineConfig, devices } from "@playwright/test";

/**
 * Full-stack E2E on its own isolated stack: Next (3031, own build dir) + API (8041, `.env.e2e`,
 * own database) + local Shopify stub (8099). Nothing is shared with the dev servers (3030 / 8040),
 * which talk to the REAL Shopify store — servers are never reused, so a busy port fails the run.
 */
export default defineConfig({
    testDir: "./e2e",
    globalSetup: "./e2e/global-setup.ts",
    timeout: 90_000,
    expect: { timeout: 15_000 },
    fullyParallel: false,
    workers: 1,
    reporter: [["list"], ["html", { open: "never", outputFolder: "e2e/report" }]],
    use: {
        baseURL: "http://localhost:3031",
        channel: "chrome",
        trace: "retain-on-failure",
        screenshot: "only-on-failure",
    },
    projects: [
        { name: "desktop", use: { ...devices["Desktop Chrome"], channel: "chrome", viewport: { width: 1440, height: 900 } } },
        { name: "mobile", use: { ...devices["Pixel 7"], channel: "chrome" }, grep: /@mobile/ },
    ],
    webServer: [
        { command: "pnpm --dir ../shielva-storefronts-api db:seed:e2e && pnpm --dir ../shielva-storefronts-api dev:e2e", url: "http://127.0.0.1:8041/health", reuseExistingServer: false, timeout: 120_000 },
        { command: "pnpm exec tsx e2e/shopify-stub.ts", url: "http://127.0.0.1:8099/health", reuseExistingServer: false, timeout: 60_000 },
        {
            command: "pnpm exec next dev --port 3031",
            url: "http://localhost:3031",
            reuseExistingServer: false,
            timeout: 180_000,
            env: { NEXT_DIST_DIR: ".next-e2e", API_ORIGIN: "http://127.0.0.1:8041", NEXT_PUBLIC_SITE_URL: "http://localhost:3031", ADMIN_HOSTS: "admin.localhost:3031", BRAND_HOSTS: "velour.localhost:3031=beauty" },
        },
    ],
});
