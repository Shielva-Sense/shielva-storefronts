"use client";

import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { SortDir } from "@/core/hooks";
import styles from "./DataTable.module.scss";

export interface DataTableProps<T> {
    columns: ColumnDef<T, unknown>[];
    data: readonly T[];
    getRowId: (row: T) => string;
    caption: string;
    /** Server-side sort (mirrored to ?sort=&dir=); only columns listed here get a sort button. */
    sort?: { id: string; dir: SortDir; sortable: readonly string[]; onToggle: (id: string) => void };
    onRowClick?: (row: T) => void;
}

/** Fully prop-driven table — pages supply columns; nothing is hardcoded here. */
export function DataTable<T>({ columns, data, getRowId, caption, sort, onRowClick }: DataTableProps<T>): React.JSX.Element {
    // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table (the mandated table lib) returns non-memoizable functions; React Compiler correctly skips this component.
    const table = useReactTable({ data: data as T[], columns, getRowId, getCoreRowModel: getCoreRowModel(), manualSorting: true });
    return (
        <div className={styles.wrap}>
            <table className={styles.table}>
                <caption className="visually-hidden">{caption}</caption>
                <thead>
                    {table.getHeaderGroups().map((hg) => (
                        <tr key={hg.id}>
                            {hg.headers.map((h) => {
                                const sortable = sort?.sortable.includes(h.column.id);
                                const active = sort?.id === h.column.id;
                                const label = flexRender(h.column.columnDef.header, h.getContext());
                                return (
                                    <th key={h.id} scope="col" aria-sort={active ? (sort?.dir === "asc" ? "ascending" : "descending") : undefined}>
                                        {sortable && sort ? (
                                            <button type="button" className={styles.sortBtn} onClick={() => sort.onToggle(h.column.id)}>
                                                {label}
                                                {active ? sort.dir === "asc" ? <ArrowUp size={13} aria-hidden="true" /> : <ArrowDown size={13} aria-hidden="true" /> : <ArrowUpDown size={13} aria-hidden="true" />}
                                            </button>
                                        ) : (
                                            label
                                        )}
                                    </th>
                                );
                            })}
                        </tr>
                    ))}
                </thead>
                <tbody>
                    {table.getRowModel().rows.map((row) => (
                        <tr key={row.id} className={onRowClick ? styles.clickable : undefined} onClick={onRowClick ? () => onRowClick(row.original) : undefined}>
                            {row.getVisibleCells().map((cell) => (
                                <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
