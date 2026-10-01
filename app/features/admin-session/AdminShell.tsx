"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { ExternalLink, LogOut } from "lucide-react";
import { ProgressOverlay } from "@/components/ui/ProgressOverlay";
import { ConfirmHost } from "@/components/ui/ConfirmDialog";
import { Field, Select } from "@/components/ui/Field";
import { Toaster } from "@/components/ui/Toast";
import { useSearchParam } from "@/core/hooks";
import { AdminProvider } from "./AdminContext";
import { ADMIN_NAV } from "./constants";
import { useAdminLogout, useAdminMe } from "./hooks";
import styles from "./AdminShell.module.scss";

export function AdminShell({ children }: { children: ReactNode }): React.JSX.Element {
    const me = useAdminMe();
    const router = useRouter();
    const pathname = usePathname();
    const [storeParam, setStore] = useSearchParam("store");
    const logout = useAdminLogout();

    useEffect(() => {
        if (me.error?.status === 401) router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
    }, [me.error, router, pathname]);

    if (me.isPending || me.error?.status === 401) return <ProgressOverlay open message="Opening the console…" />;
    if (me.isError) return <p className={styles.error}>Couldn&apos;t reach the storefronts API: {me.error.message}</p>;

    const stores = me.data.stores;
    const store = stores.find((s) => s.slug === storeParam) ?? stores[0];
    if (!store) return <p className={styles.error}>Your account has no storefront memberships.</p>;
    const qs = `?store=${store.slug}`;

    return (
        <AdminProvider me={me.data} store={store}>
            <div className={styles.shell}>
                <aside className={styles.sidebar}>
                    <p className={styles.logo}>Storefronts <span>admin</span></p>
                    <Field label="Storefront">
                        {(id) => (
                            <Select id={id} value={store.slug} onChange={(e) => setStore(e.target.value)}>
                                {stores.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
                            </Select>
                        )}
                    </Field>
                    <nav aria-label="Admin sections" className={styles.nav}>
                        <ul>
                            {ADMIN_NAV.filter((n) => !("storeOnly" in n) || n.storeOnly === store.slug).map((n) => {
                                const active = n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href);
                                return (
                                    <li key={n.href}>
                                        <Link href={`${n.href}${qs}`} aria-current={active ? "page" : undefined}>{n.label}</Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>
                    <div className={styles.foot}>
                        <a href={`/${store.slug}`} target="_blank" rel="noopener noreferrer" className={styles.viewStore}>View storefront <ExternalLink size={13} aria-hidden="true" /></a>
                        <p className={styles.user}>{me.data.email} · {store.role}</p>
                        <button type="button" className={styles.logout} onClick={() => logout.mutate()} disabled={logout.isPending}>
                            <LogOut size={14} aria-hidden="true" /> Sign out
                        </button>
                    </div>
                </aside>
                <main id="main-content" tabIndex={-1} className={styles.main}>{children}</main>
            </div>
            <Toaster />
            <ConfirmHost />
        </AdminProvider>
    );
}

