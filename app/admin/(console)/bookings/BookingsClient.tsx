"use client";

import { useCallback, useState, type ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { CalendarClock, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { ListLayout } from "@/components/layouts/ListLayout";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { BrandSpinner } from "@/components/ui/ProgressOverlay";
import { StatSection, type Stat } from "@/components/ui/StatSection";
import { TabNav } from "@/components/ui/TabNav";
import { Toolbar } from "@/components/ui/Toolbar";
import type { ApiError } from "@/core/api-client";
import { useSearchParam } from "@/core/hooks";
import { useAdmin } from "@/features/admin-session/AdminContext";
import contentStyles from "@/features/admin-content/components/Content.module.scss";
import { ReadOnlyNotice } from "@/components/ui/ReadOnlyNotice";
import { ClosuresTab } from "@/features/admin-bookings/components/ClosuresTab";
import { MembershipsTab } from "@/features/admin-bookings/components/MembershipsTab";
import { ScheduleTab } from "@/features/admin-bookings/components/ScheduleTab";
import { ServiceEditor } from "@/features/admin-bookings/components/ServiceEditor";
import { ServicesTab } from "@/features/admin-bookings/components/ServicesTab";
import { StaffEditor } from "@/features/admin-bookings/components/StaffEditor";
import { StaffTab } from "@/features/admin-bookings/components/StaffTab";
import bookingStyles from "@/features/admin-bookings/components/Bookings.module.scss";
import { addDays, BOOKING_TABS, BOOKING_WINDOW_DAYS, BOOKINGS_STORE, formatDateKey, isBookingTab, isDateKey, todayIn, type BookingTab } from "@/features/admin-bookings/constants";
import {
    useAddClosure,
    useBookings,
    useClosures,
    useDeleteClosure,
    useMemberships,
    useSaveService,
    useSaveStaff,
    useServices,
    useStaff,
    useUpdateBookingStatus,
} from "@/features/admin-bookings/hooks";
import type { Booking, Service, StaffMember } from "@/features/admin-bookings/types";

const TAB_PREFIX = "bookings";
const NEW = "new";

function deriveStats(items: readonly Booking[]): Stat[] {
    const live = items.filter((b) => b.status !== "expired");
    const count = (s: Booking["status"]): number => items.filter((b) => b.status === s).length;
    const noShows = count("no_show");
    const held = count("held");
    return [
        { label: "Bookings this week", value: String(live.length), hint: "Excludes expired holds" },
        { label: "Confirmed", value: String(count("confirmed")), hint: "Deposit paid", tone: "success" },
        { label: "Held", value: String(held), hint: "Awaiting deposit", tone: held > 0 ? "warning" : "neutral" },
        { label: "No-shows", value: String(noShows), hint: "Deposit retained", tone: noShows > 0 ? "danger" : "neutral" },
    ];
}

/** Loading / error / content for one tab's query. */
function QueryState<T>({ query, loading, what, children }: { query: UseQueryResult<T, ApiError>; loading: string; what: string; children: (data: T) => ReactNode }): React.JSX.Element {
    if (query.isPending) return <BrandSpinner mode="content" message={loading} />;
    if (query.isError)
        return (
            <div className={contentStyles.errorBox} role="alert">
                <p>Couldn&apos;t load {what}: {query.error.message}</p>
                <Button variant="secondary" onClick={() => void query.refetch()}>Try again</Button>
            </div>
        );
    return <>{children(query.data)}</>;
}

export function BookingsClient(): React.JSX.Element {
    const { store } = useAdmin();
    if (store.slug !== BOOKINGS_STORE)
        return (
            <ListLayout title="Bookings" subtitle="Appointments, services, staff hours and memberships for service businesses.">
                <EmptyState
                    icon={<CalendarClock size={32} aria-hidden="true" />}
                    title={`${store.name} doesn't take bookings`}
                    description="Bookings belong to service businesses: customers reserve a time with a stylist and pay a deposit to hold it. This storefront sells products, so there is no calendar to manage — switch to the salon storefront in the sidebar to manage appointments."
                />
            </ListLayout>
        );
    return <SalonBookings />;
}

function SalonBookings(): React.JSX.Element {
    const { tenant, store, can } = useAdmin();
    const canEdit = can("admin");
    const [tabRaw, setTab] = useSearchParam("tab", "schedule");
    const tab: BookingTab = isBookingTab(tabRaw) ? tabRaw : "schedule";
    const [fromParam, setFrom] = useSearchParam("from");

    // The store time zone arrives with the first bookings response; until then "today" is the browser's.
    const [timezone, setTimezone] = useState<string | undefined>(undefined);
    const today = todayIn(timezone);
    const from = isDateKey(fromParam) ? fromParam : today;

    const bookings = useBookings(tenant, from, tab === "schedule");
    if (bookings.data && bookings.data.timezone !== timezone) setTimezone(bookings.data.timezone);
    const services = useServices(tenant, tab === "services" || tab === "staff");
    const staff = useStaff(tenant, tab === "staff" || tab === "closures");
    const closures = useClosures(tenant, tab === "closures");
    const memberships = useMemberships(tenant, tab === "memberships");

    const updateStatus = useUpdateBookingStatus(tenant, from);
    const saveService = useSaveService(tenant);
    const saveStaff = useSaveStaff(tenant);
    const addClosure = useAddClosure(tenant);
    const deleteClosure = useDeleteClosure(tenant);

    const [serviceEditing, setServiceEditing] = useState<string | null>(null);
    const [staffEditing, setStaffEditing] = useState<string | null>(null);
    const editService = useCallback((s: Service) => setServiceEditing(s.handle), []);
    const editStaff = useCallback((m: StaffMember) => setStaffEditing(m.handle), []);

    const editingService = serviceEditing && serviceEditing !== NEW ? (services.data?.find((s) => s.handle === serviceEditing) ?? null) : null;
    const editingStaff = staffEditing && staffEditing !== NEW ? (staff.data?.find((m) => m.handle === staffEditing) ?? null) : null;

    const weekEnd = addDays(from, BOOKING_WINDOW_DAYS - 1);
    let toolbar: ReactNode;
    if (tab === "schedule")
        toolbar = (
            <Toolbar
                label="Week navigation"
                start={
                    <div className={bookingStyles.weekNav}>
                        <Button variant="secondary" size="sm" leftIcon={<ChevronLeft size={14} aria-hidden="true" />} onClick={() => setFrom(addDays(from, -BOOKING_WINDOW_DAYS))}>
                            Previous week
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setFrom("")} disabled={from === today}>
                            Today
                        </Button>
                        <Button variant="secondary" size="sm" rightIcon={<ChevronRight size={14} aria-hidden="true" />} onClick={() => setFrom(addDays(from, BOOKING_WINDOW_DAYS))}>
                            Next week
                        </Button>
                    </div>
                }
                end={
                    <p aria-live="polite">
                        <span className={bookingStyles.weekLabel}>{formatDateKey(from)} – {formatDateKey(weekEnd)}</span>{" "}
                        {timezone ? <span className={bookingStyles.tz}>· times in {timezone}</span> : null}
                    </p>
                }
            />
        );
    else if (tab === "services" || tab === "staff")
        toolbar = (
            <Toolbar
                label={tab === "services" ? "Service actions" : "Staff actions"}
                end={
                    <Button leftIcon={<Plus size={14} aria-hidden="true" />} onClick={() => (tab === "services" ? setServiceEditing(NEW) : setStaffEditing(NEW))} disabled={!canEdit}>
                        {tab === "services" ? "New service" : "Add stylist"}
                    </Button>
                }
            />
        );

    let panel: ReactNode;
    switch (tab) {
        case "schedule":
            panel = (
                <QueryState query={bookings} loading="Loading this week's bookings…" what="bookings">
                    {(data) => (
                        <ScheduleTab
                            from={from}
                            today={today}
                            timezone={data.timezone}
                            bookings={data.items}
                            canEdit={canEdit}
                            onStatus={(id, status) => updateStatus.mutate({ id, status })}
                        />
                    )}
                </QueryState>
            );
            break;
        case "services":
            panel = (
                <QueryState query={services} loading="Loading the service menu…" what="services">
                    {(data) => <ServicesTab services={data} canEdit={canEdit} onNew={() => setServiceEditing(NEW)} onEdit={editService} />}
                </QueryState>
            );
            break;
        case "staff":
            panel = (
                <QueryState query={staff} loading="Loading the team…" what="staff">
                    {(data) => <StaffTab staff={data} services={services.data ?? []} canEdit={canEdit} onNew={() => setStaffEditing(NEW)} onEdit={editStaff} />}
                </QueryState>
            );
            break;
        case "closures":
            panel = (
                <QueryState query={closures} loading="Loading closures…" what="closures">
                    {(data) => (
                        <ClosuresTab
                            closures={data}
                            staff={staff.data ?? []}
                            today={today}
                            canEdit={canEdit}
                            onAdd={(input) => addClosure.mutate(input)}
                            onDelete={(id) => deleteClosure.mutate(id)}
                        />
                    )}
                </QueryState>
            );
            break;
        case "memberships":
            panel = (
                <QueryState query={memberships} loading="Loading memberships…" what="memberships">
                    {(data) => <MembershipsTab memberships={data} />}
                </QueryState>
            );
            break;
    }

    return (
        <ListLayout
            title="Bookings"
            subtitle={`Appointments at ${store.name}: the weekly schedule, the bookable service menu, stylist hours, closures and memberships.`}
            stats={tab === "schedule" ? <StatSection stats={deriveStats(bookings.data?.items ?? [])} show={bookings.isSuccess} /> : undefined}
            aboveContent={canEdit ? undefined : <ReadOnlyNotice what="bookings, services or staff" />}
            tabs={<TabNav label="Bookings sections" idPrefix={TAB_PREFIX} tabs={BOOKING_TABS} active={tab} onChange={(id) => setTab(id)} />}
            toolbar={toolbar}
        >
            <div role="tabpanel" id={`${TAB_PREFIX}-panel`} aria-labelledby={`${TAB_PREFIX}-tab-${tab}`} tabIndex={0} className={bookingStyles.stack}>
                {panel}
            </div>
            {serviceEditing ? (
                <ServiceEditor
                    key={serviceEditing}
                    service={editingService}
                    canEdit={canEdit}
                    onClose={() => setServiceEditing(null)}
                    onSave={(input) => {
                        setServiceEditing(null);
                        saveService.mutate(input);
                    }}
                />
            ) : null}
            {staffEditing ? (
                <StaffEditor
                    key={staffEditing}
                    member={editingStaff}
                    services={services.data ?? []}
                    canEdit={canEdit}
                    onClose={() => setStaffEditing(null)}
                    onSave={(input) => {
                        setStaffEditing(null);
                        saveStaff.mutate(input);
                    }}
                />
            ) : null}
        </ListLayout>
    );
}
