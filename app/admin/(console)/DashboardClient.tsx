"use client";

import type { CSSProperties } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { BarChart3, FlaskConical, Scale } from "lucide-react";
import { BarChart, type BarDatum } from "@/components/ui/BarChart";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, Select } from "@/components/ui/Field";
import { BrandSpinner } from "@/components/ui/ProgressOverlay";
import { StatSection, type Stat } from "@/components/ui/StatSection";
import { StatusBadge, type Tone } from "@/components/ui/StatusBadge";
import { ListLayout } from "@/components/layouts/ListLayout";
import { formatCents, formatDay, formatNumber, formatPercent } from "@/core/formatters";
import { useSearchParam } from "@/core/hooks";
import { useAdmin } from "@/features/admin-session/AdminContext";
import { AdminPanel, LoadError, PanelNote } from "@/components/ui/Panel";
import { ANALYTICS_WINDOWS, BOOKINGS_STORE, DEFAULT_WINDOW, FUNNEL_STEPS, LIFT_NOISE } from "@/features/admin-analytics/constants";
import { useAnalyticsSummary, useExperiments, useStoreComparison } from "@/features/admin-analytics/hooks";
import type { AnalyticsSummary, CompareRow, Experiment, ExperimentArm, Funnel, TopProduct } from "@/features/admin-analytics/types";
import styles from "./Dashboard.module.scss";

const TOP_COLUMNS: ColumnDef<TopProduct, unknown>[] = [
    { id: "title", header: "Product", cell: ({ row }) => <span className={styles.strong}>{row.original.title}</span> },
    { id: "sku", header: "SKU", cell: ({ row }) => <span className={styles.mono}>{row.original.sku ?? "—"}</span> },
    { id: "units", header: "Units", cell: ({ row }) => formatNumber(row.original.units) },
    { id: "revenue", header: "Revenue", cell: ({ row }) => formatCents(row.original.revenueCents) },
];

const COMPARE_COLUMNS: ColumnDef<CompareRow, unknown>[] = [
    { id: "store", header: "Storefront", cell: ({ row }) => <span className={styles.strong}>{row.original.name}</span> },
    { id: "net", header: "Net revenue", cell: ({ row }) => formatCents(row.original.kpis.netCents) },
    { id: "orders", header: "Orders", cell: ({ row }) => formatNumber(row.original.kpis.orders) },
    { id: "aov", header: "AOV", cell: ({ row }) => formatCents(row.original.kpis.aovCents) },
    { id: "conversion", header: "Conversion", cell: ({ row }) => formatPercent(row.original.kpis.conversion) },
    { id: "repeat", header: "Repeat rate", cell: ({ row }) => formatPercent(row.original.kpis.repeatRate) },
];

function armLabel(arm: ExperimentArm): string {
    return `${formatNumber(arm.purchases)} / ${formatNumber(arm.visitors)} · ${formatPercent(arm.rate)}`;
}

function liftBadge(lift: number | null): { tone: Tone; label: string } {
    if (lift === null) return { tone: "neutral", label: "Not enough data" };
    if (Math.abs(lift) < LIFT_NOISE) return { tone: "neutral", label: `No clear winner (${formatPercent(lift)})` };
    return lift > 0 ? { tone: "success", label: `B leads +${formatPercent(lift)}` } : { tone: "danger", label: `A leads (B ${formatPercent(lift)})` };
}

const EXPERIMENT_COLUMNS: ColumnDef<Experiment, unknown>[] = [
    { id: "type", header: "Section", cell: ({ row }) => <span className={styles.strong}>{row.original.type}</span> },
    { id: "split", header: "Split (A / B)", cell: ({ row }) => `${100 - row.original.split}% / ${row.original.split}%` },
    { id: "a", header: "A · purchases / visitors", cell: ({ row }) => armLabel(row.original.a) },
    { id: "b", header: "B · purchases / visitors", cell: ({ row }) => armLabel(row.original.b) },
    {
        id: "lift",
        header: "Lift",
        cell: ({ row }) => {
            const badge = liftBadge(row.original.lift);
            return <StatusBadge tone={badge.tone}>{badge.label}</StatusBadge>;
        },
    },
];

function dayLabel(day: string): string {
    return formatDay(new Date(`${day}T00:00:00`));
}

function buildStats(s: AnalyticsSummary): Stat[] {
    const k = s.kpis;
    return [
        { label: "Net revenue", value: formatCents(k.netCents), hint: `${formatCents(k.grossCents)} gross · ${formatCents(k.refundedCents)} refunded` },
        { label: "Orders", value: formatNumber(k.orders), hint: "Paid, not cancelled" },
        { label: "Average order", value: formatCents(k.aovCents), hint: "Gross ÷ orders" },
        { label: "Conversion", value: formatPercent(k.conversion), hint: "Purchasers ÷ visitors" },
        { label: "Refund rate", value: formatPercent(k.refundRate), hint: "Refunded ÷ gross", tone: k.refundRate > 0.1 ? "warning" : "neutral" },
        { label: "Repeat rate", value: formatPercent(k.repeatRate), hint: "Customers with 2+ orders", tone: k.repeatRate >= 0.25 ? "success" : "neutral" },
    ];
}

function FunnelList({ funnel }: { funnel: Funnel }): React.JSX.Element {
    const top = Math.max(1, funnel.visitors);
    return (
        <ol className={styles.funnel}>
            {FUNNEL_STEPS.map((step, i) => {
                const value = funnel[step.key];
                const prevStep = i > 0 ? FUNNEL_STEPS[i - 1] : undefined;
                const prev = prevStep ? funnel[prevStep.key] : null;
                const drop = prev ? 1 - value / prev : null;
                const fill = { "--fill": Math.min(1, value / top) } as CSSProperties;
                return (
                    <li key={step.key} className={styles.step}>
                        <div className={styles.stepHead}>
                            <span className={styles.strong}>{step.label}</span>
                            <span className={styles.stepValue}>{formatNumber(value)}</span>
                        </div>
                        <span className={styles.track} aria-hidden="true"><span className={styles.fill} style={fill} /></span>
                        <p className={styles.stepHint}>
                            {step.hint}
                            {drop !== null ? <> · <span className={styles.drop}>{formatPercent(Math.max(0, drop))} drop-off</span></> : null}
                        </p>
                    </li>
                );
            })}
        </ol>
    );
}

export function DashboardClient(): React.JSX.Element {
    const { tenant, store } = useAdmin();
    const [daysRaw, setDays] = useSearchParam("days", DEFAULT_WINDOW);
    const days = ANALYTICS_WINDOWS.some((w) => w.value === daysRaw) ? Number(daysRaw) : Number(DEFAULT_WINDOW);
    const summary = useAnalyticsSummary(tenant, days);
    const compare = useStoreComparison(tenant, days);
    const experiments = useExperiments(tenant, days);

    const windowSelect = (
        <Field label="Reporting window" hideLabel>
            {(id) => (
                <Select id={id} value={String(days)} onChange={(e) => setDays(e.target.value)}>
                    {ANALYTICS_WINDOWS.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
                </Select>
            )}
        </Field>
    );

    const data = summary.data;
    const chart: BarDatum[] = data ? data.series.map((p) => ({ label: dayLabel(p.day), value: p.revenueCents, display: `${formatCents(p.revenueCents)} · ${formatNumber(p.orders)} ${p.orders === 1 ? "order" : "orders"}` })) : [];
    const hasRevenue = chart.some((d) => d.value > 0);

    return (
        <ListLayout
            title="Dashboard"
            subtitle={`${store.name} · revenue, conversion and retention over the last ${days} days`}
            headerActions={windowSelect}
            stats={data ? <StatSection stats={buildStats(data)} show={!summary.isPending && !summary.isError} /> : null}
        >
            {summary.isPending ? <BrandSpinner mode="content" message="Crunching this window's numbers…" /> : null}
            {summary.isError ? <LoadError message={`Couldn't load analytics: ${summary.error.message}`} onRetry={() => void summary.refetch()} /> : null}

            {data ? (
                <>
                    <div className={styles.grid}>
                        <AdminPanel id="revenue" title="Revenue by day" description="Paid orders (gross, before refunds) in the store's timezone.">
                            {hasRevenue ? (
                                <BarChart data={chart} title={`Daily revenue, last ${days} days`} />
                            ) : (
                                <EmptyState icon={<BarChart3 size={32} aria-hidden="true" />} title="No paid orders in this window" description="Revenue appears here as soon as Shopify reports a paid order. Refunds are subtracted in the net revenue KPI above." />
                            )}
                        </AdminPanel>
                        <AdminPanel id="funnel" title="Conversion funnel" description="Distinct visitors reaching each step — the drop-off shows where shoppers leave.">
                            <FunnelList funnel={data.kpis.funnel} />
                        </AdminPanel>
                    </div>

                    <AdminPanel id="top-products" title="Top products" description="Best sellers by revenue from paid orders in this window.">
                        {data.topProducts.length > 0 ? (
                            <DataTable columns={TOP_COLUMNS} data={data.topProducts} getRowId={(r) => r.sku ?? r.title} caption="Top products by revenue" />
                        ) : (
                            <PanelNote>No products sold yet in this window. Best sellers are ranked by line revenue once orders arrive.</PanelNote>
                        )}
                    </AdminPanel>

                    {store.slug === BOOKINGS_STORE ? (
                        <AdminPanel id="bookings" title="Bookings" description="Appointments confirmed in this window. Deposits are charged through Shopify at booking time.">
                            <StatSection
                                stats={[
                                    { label: "Booked", value: formatNumber(data.bookings.booked), hint: "Confirmed, completed or no-show" },
                                    { label: "No-show rate", value: formatPercent(data.bookings.noShowRate), tone: data.bookings.noShowRate > 0.1 ? "warning" : "neutral", hint: "No-shows ÷ booked" },
                                    { label: "Deposits", value: formatCents(data.bookings.depositCents), hint: "Collected on booked appointments" },
                                ]}
                            />
                        </AdminPanel>
                    ) : null}
                </>
            ) : null}

            <AdminPanel
                id="icp-comparison"
                title="ICP comparison — per-audience proof"
                description="The same KPIs side by side for every storefront you manage, so each audience's storefront design can be judged on results."
            >
                {compare.isPending ? <BrandSpinner mode="content" message="Comparing storefronts…" /> : null}
                {compare.isError ? <LoadError message={`Couldn't load the comparison: ${compare.error.message}`} onRetry={() => void compare.refetch()} /> : null}
                {compare.data && compare.data.items.length > 0 ? (
                    <DataTable columns={COMPARE_COLUMNS} data={compare.data.items} getRowId={(r) => r.slug} caption="Storefront comparison by audience" />
                ) : null}
                {compare.data && compare.data.items.length === 0 ? (
                    <EmptyState icon={<Scale size={32} aria-hidden="true" />} title="No storefronts to compare" description="The comparison lists every storefront your account is a member of, with net revenue, orders, AOV, conversion and repeat rate side by side." />
                ) : null}
            </AdminPanel>

            <AdminPanel id="experiments" title="A/B experiments" description="Page sections with a traffic split. Purchases are attributed to the variant a visitor saw before checkout.">
                {experiments.isPending ? <BrandSpinner mode="content" message="Tallying experiment results…" /> : null}
                {experiments.isError ? <LoadError message={`Couldn't load experiments: ${experiments.error.message}`} onRetry={() => void experiments.refetch()} /> : null}
                {experiments.data && experiments.data.items.length > 0 ? (
                    <DataTable columns={EXPERIMENT_COLUMNS} data={experiments.data.items} getRowId={(r) => r.sectionId} caption="A/B experiment results" />
                ) : null}
                {experiments.data && experiments.data.items.length === 0 ? (
                    <EmptyState
                        icon={<FlaskConical size={32} aria-hidden="true" />}
                        title="No experiments running"
                        description="Give a page section a variant B and a traffic split in the page builder. Visitors are assigned A or B, and this table compares their purchase rates."
                    />
                ) : null}
            </AdminPanel>
        </ListLayout>
    );
}
