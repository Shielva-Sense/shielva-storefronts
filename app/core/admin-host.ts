/**
 * SOLE owner of "is this the admin address?". The admin console, the admin API proxy and the
 * in-place editor are only served on hostnames listed in ADMIN_HOSTS (comma-separated host[:port],
 * e.g. "admin.velour.com,admin.localhost:3030"). Public brand domains never expose them — even to
 * a signed-in admin. Unset = no admin host anywhere. Matched on the Host header only.
 */
export function adminHosts(): string[] {
    return (process.env.ADMIN_HOSTS ?? "")
        .split(",")
        .map((h) => h.trim().toLowerCase())
        .filter(Boolean);
}

export function isAdminHost(host: string | null | undefined): boolean {
    return Boolean(host) && adminHosts().includes((host as string).toLowerCase());
}
