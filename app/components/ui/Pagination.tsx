"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatNumber } from "@/core/formatters";
import styles from "./Pagination.module.scss";

export function Pagination({ page, pages, total, size, onPage }: { page: number; pages: number; total: number; size: number; onPage: (p: number) => void }): React.JSX.Element {
    const from = total === 0 ? 0 : (page - 1) * size + 1;
    const to = Math.min(total, page * size);
    return (
        <nav className={styles.nav} aria-label="Pagination">
            <p className={styles.info}>Showing {formatNumber(from)}–{formatNumber(to)} of {formatNumber(total)}</p>
            <div className={styles.buttons}>
                <button type="button" onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Previous page"><ChevronLeft size={14} aria-hidden="true" /></button>
                <span aria-current="page">{page} / {pages}</span>
                <button type="button" onClick={() => onPage(page + 1)} disabled={page >= pages} aria-label="Next page"><ChevronRight size={14} aria-hidden="true" /></button>
            </div>
        </nav>
    );
}
