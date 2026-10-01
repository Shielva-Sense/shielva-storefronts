import { apiFetch } from "@/core/api-client";
import type { AdminMe } from "./types";

export type { AdminMe, AdminStore, AdminRole } from "./types";

export async function fetchAdminMe(): Promise<AdminMe> {
    return apiFetch<AdminMe>("/admin/me");
}

export async function adminLogin(email: string, password: string): Promise<{ email: string; name: string }> {
    return apiFetch("/admin/login", { method: "POST", body: { email, password } });
}

export async function adminLogout(): Promise<void> {
    await apiFetch("/admin/logout", { method: "POST" });
}
