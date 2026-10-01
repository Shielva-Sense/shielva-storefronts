"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { AdminMe, AdminRole, AdminStore } from "./types";

interface AdminContextValue {
    me: AdminMe;
    store: AdminStore;
    /** Slug sent as x-tenant; the API re-verifies membership on every request. */
    tenant: string;
    can: (min: AdminRole) => boolean;
}

const AdminContext = createContext<AdminContextValue | null>(null);
const RANK: Record<AdminRole, number> = { viewer: 0, admin: 1, owner: 2 };

export function AdminProvider({ me, store, children }: { me: AdminMe; store: AdminStore; children: ReactNode }): React.JSX.Element {
    const value = useMemo<AdminContextValue>(() => ({ me, store, tenant: store.slug, can: (min) => RANK[store.role] >= RANK[min] }), [me, store]);
    return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin(): AdminContextValue {
    const ctx = useContext(AdminContext);
    if (!ctx) throw new Error("useAdmin must be used inside the admin console");
    return ctx;
}
