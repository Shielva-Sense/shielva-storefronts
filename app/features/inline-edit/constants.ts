/** Roles allowed to edit the live storefront (viewers never see the editor). */
export const EDITOR_ROLES = ["owner", "admin"] as const;

export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const PHOTO_MAX_BYTES = 10 * 1024 * 1024;

/** Shopify processes an uploaded photo, then its products/update webhook brings the CDN URL. */
export const PHOTO_SETTLE_MS = 6000;

export const SITE_LIMITS = { navLinks: 8, columns: 4, columnLinks: 10 } as const;
