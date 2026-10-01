"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_SERVICE_ID } from "./constants";

interface SalonBookingValue {
    serviceId: string;
    setServiceId: (id: string) => void;
    staffHandle: string | null;
    setStaffHandle: (handle: string | null) => void;
    /** Pre-select a service (and optionally a stylist) from anywhere on the page and bring the widget into view. */
    bookService: (id: string, staff?: string) => void;
}

const SalonBookingContext = createContext<SalonBookingValue | null>(null);

export function SalonBookingProvider({ children }: { children: ReactNode }): React.JSX.Element {
    const [serviceId, setServiceId] = useState<string>(DEFAULT_SERVICE_ID);
    const [staffHandle, setStaffHandle] = useState<string | null>(null);

    const bookService = useCallback((id: string, staff?: string) => {
        setServiceId(id);
        setStaffHandle(staff ?? null);
        const widget = document.getElementById("book");
        widget?.scrollIntoView({ behavior: "smooth", block: "center" });
        widget?.querySelector<HTMLElement>("select, button")?.focus({ preventScroll: true });
    }, []);

    const value = useMemo(() => ({ serviceId, setServiceId, staffHandle, setStaffHandle, bookService }), [serviceId, staffHandle, bookService]);
    return <SalonBookingContext.Provider value={value}>{children}</SalonBookingContext.Provider>;
}

export function useSalonBooking(): SalonBookingValue {
    const ctx = useContext(SalonBookingContext);
    if (!ctx) throw new Error("useSalonBooking must be used inside <SalonBookingProvider>");
    return ctx;
}
