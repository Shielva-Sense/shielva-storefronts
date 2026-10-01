import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.scss";

type Variant = "primary" | "secondary" | "ghost" | "accent" | "danger";
type Size = "sm" | "md" | "lg";

interface CommonProps {
    variant?: Variant;
    size?: Size;
    fullWidth?: boolean;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
    children: ReactNode;
}

function cls(variant: Variant, size: Size, fullWidth: boolean, extra?: string): string {
    return [styles.btn, styles[variant], styles[size], fullWidth ? styles.full : "", extra ?? ""].filter(Boolean).join(" ");
}

export function Button({
    variant = "primary",
    size = "md",
    fullWidth = false,
    leftIcon,
    rightIcon,
    children,
    className,
    type = "button",
    ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>): React.JSX.Element {
    return (
        <button type={type} className={cls(variant, size, fullWidth, className)} {...rest}>
            {leftIcon}
            <span>{children}</span>
            {rightIcon}
        </button>
    );
}

export function ButtonLink({
    href,
    variant = "primary",
    size = "md",
    fullWidth = false,
    leftIcon,
    rightIcon,
    children,
    external = false,
}: CommonProps & { href: string; external?: boolean }): React.JSX.Element {
    if (external) {
        return (
            <a href={href} target="_blank" rel="noopener noreferrer" className={cls(variant, size, fullWidth)}>
                {leftIcon}
                <span>{children}</span>
                {rightIcon}
            </a>
        );
    }
    return (
        <Link href={href} className={cls(variant, size, fullWidth)}>
            {leftIcon}
            <span>{children}</span>
            {rightIcon}
        </Link>
    );
}
