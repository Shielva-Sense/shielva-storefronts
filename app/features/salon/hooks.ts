"use client";

import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { toast } from "@/components/ui/Toast";
import type { ApiError } from "@/core/api-client";
import { queryKeys } from "@/core/query-keys";
import { fetchAvailability, fetchBookingCatalog, holdBooking, type BookingCatalog, type HoldInput, type Slot } from "./api";

export function useBookingCatalog(initial: BookingCatalog | null): UseQueryResult<BookingCatalog, ApiError> {
    return useQuery<BookingCatalog, ApiError>({
        queryKey: queryKeys.store.bookingServices("salon"),
        queryFn: fetchBookingCatalog,
        ...(initial ? { initialData: initial } : {}),
    });
}

export function useAvailability(service: string, date: string | null, staff: string | null): UseQueryResult<Slot[], ApiError> {
    return useQuery<Slot[], ApiError>({
        queryKey: queryKeys.store.availability("salon", service, date ?? "", staff ?? "any"),
        queryFn: () => fetchAvailability(service, date as string, staff),
        enabled: Boolean(date && service),
        staleTime: 30_000,
    });
}

/**
 * Places a 10-minute hold. Optimistically removes the slot from the cached grid so a
 * double-click can't request it twice; rolls back if the API refuses.
 */
export function useHoldBooking(service: string, date: string | null, staff: string | null) {
    const qc = useQueryClient();
    const key = queryKeys.store.availability("salon", service, date ?? "", staff ?? "any");
    return useMutation({
        mutationFn: (input: HoldInput) => holdBooking(input),
        onMutate: async (input) => {
            await qc.cancelQueries({ queryKey: key });
            const prev = qc.getQueryData<Slot[]>(key);
            qc.setQueryData<Slot[]>(key, (old) => old?.filter((s) => s.startsAt !== input.startsAt));
            return { prev };
        },
        onError: (err: Error, _input, ctx) => {
            if (ctx?.prev) qc.setQueryData<Slot[]>(key, ctx.prev);
            toast.error(err.message);
        },
        onSettled: () => qc.invalidateQueries({ queryKey: ["store", "salon", "availability"] }),
    });
}
