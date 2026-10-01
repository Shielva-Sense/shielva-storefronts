import { adminApi } from "./helpers";

/** Every spec needs storefront SKUs linked to their (stub) Shopify variants — Shopify variant SKU == our SKU. */
export default async function globalSetup(): Promise<void> {
    const admin = await adminApi();
    for (const store of ["beauty", "salon", "fashion"]) await admin.call("POST", "/catalog/sync", store);
    await admin.ctx.dispose();
}
