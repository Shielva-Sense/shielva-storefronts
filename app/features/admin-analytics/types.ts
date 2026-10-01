export interface Funnel {
    visitors: number;
    addedToCart: number;
    startedCheckout: number;
    purchased: number;
}

export interface Kpis {
    grossCents: number;
    refundedCents: number;
    netCents: number;
    orders: number;
    aovCents: number;
    refundRate: number;
    repeatRate: number;
    funnel: Funnel;
    conversion: number;
}

export interface SeriesPoint {
    day: string;
    revenueCents: number;
    orders: number;
}

export interface TopProduct {
    sku: string | null;
    title: string;
    units: number;
    revenueCents: number;
}

export interface BookingStats {
    booked: number;
    noShowRate: number;
    depositCents: number;
}

export interface AnalyticsSummary {
    days: number;
    currency: string;
    kpis: Kpis;
    series: SeriesPoint[];
    topProducts: TopProduct[];
    bookings: BookingStats;
}

export interface CompareRow {
    slug: string;
    name: string;
    currency: string;
    kpis: Kpis;
}

export interface CompareResponse {
    days: number;
    items: CompareRow[];
}

export interface ExperimentArm {
    visitors: number;
    purchases: number;
    revenueCents: number;
    rate: number;
}

export interface Experiment {
    sectionId: string;
    type: string;
    split: number;
    a: ExperimentArm;
    b: ExperimentArm;
    lift: number | null;
}

export interface ExperimentsResponse {
    days: number;
    items: Experiment[];
}
