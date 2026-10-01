"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { ProgressOverlay } from "@/components/ui/ProgressOverlay";
import { Toaster } from "@/components/ui/Toast";
import { useAdminLogin } from "@/features/admin-session/hooks";
import styles from "./Login.module.scss";

const SAFE_NEXT = /^\/admin(\/[a-z0-9/-]*)?$/;

export function LoginClient(): React.JSX.Element {
    const params = useSearchParams();
    const nextParam = params.get("next") ?? "/admin";
    const login = useAdminLogin(SAFE_NEXT.test(nextParam) ? nextParam : "/admin");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const submit = (e: FormEvent<HTMLFormElement>): void => {
        e.preventDefault();
        login.mutate({ email, password });
    };

    return (
        <main id="main-content" tabIndex={-1} className={styles.page}>
            <form className={styles.card} onSubmit={submit}>
                <h1 className={styles.title}>Storefronts admin</h1>
                <p className={styles.sub}>Orders, transactions, content and analytics for every storefront you manage.</p>
                <Field label="Email" required>
                    {(id) => <Input id={id} type="email" autoComplete="username" required aria-required="true" value={email} onChange={(e) => setEmail(e.target.value)} />}
                </Field>
                <Field label="Password" required>
                    {(id) => <Input id={id} type="password" autoComplete="current-password" required aria-required="true" value={password} onChange={(e) => setPassword(e.target.value)} />}
                </Field>
                <Button type="submit" size="lg" fullWidth disabled={login.isPending}>Sign in</Button>
            </form>
            <ProgressOverlay open={login.isPending} message="Signing you in…" />
            <Toaster />
        </main>
    );
}
