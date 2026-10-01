"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient, type UseMutationResult, type UseQueryResult } from "@tanstack/react-query";
import { toast } from "@/components/ui/Toast";
import type { ApiError } from "@/core/api-client";
import { queryKeys } from "@/core/query-keys";
import { addClosure, deleteClosure, fetchBookings, fetchClosures, fetchMemberships, fetchServices, fetchStaff, saveService, saveStaff, updateBookingStatus } from "./api";
import { BOOKING_STATUS_LABEL, PENDING_PREFIX } from "./constants";
import type { BookingsResponse, BookingStatus, Closure, ClosureInput, Membership, Service, ServiceInput, StaffInput, StaffMember } from "./types";

type Rollback<T> = { prev: T | undefined };

// ─────────────── Schedule ───────────────

/** Keeps the previous week on screen while the next loads (and keeps the store time zone known). */
export function useBookings(tenant: string, from: string, enabled: boolean): UseQueryResult<BookingsResponse, ApiError> {
    return useQuery<BookingsResponse, ApiError>({
        queryKey: queryKeys.admin.bookings(tenant, from),
        queryFn: () => fetchBookings(tenant, from),
        placeholderData: keepPreviousData,
        refetchInterval: 60_000,
        enabled,
    });
}

export function useUpdateBookingStatus(tenant: string, from: string): UseMutationResult<void, ApiError, { id: string; status: BookingStatus }, Rollback<BookingsResponse>> {
    const qc = useQueryClient();
    const queryKey = queryKeys.admin.bookings(tenant, from);
    return useMutation<void, ApiError, { id: string; status: BookingStatus }, Rollback<BookingsResponse>>({
        mutationFn: ({ id, status }) => updateBookingStatus(tenant, id, status),
        onMutate: async ({ id, status }) => {
            await qc.cancelQueries({ queryKey });
            const prev = qc.getQueryData<BookingsResponse>(queryKey);
            qc.setQueryData<BookingsResponse>(queryKey, (old) => (old ? { ...old, items: old.items.map((b) => (b.id === id ? { ...b, status } : b)) } : old));
            return { prev };
        },
        onSuccess: (_res, { status }) => toast.success(`Booking marked ${BOOKING_STATUS_LABEL[status].toLowerCase()}.`),
        onError: (err, _vars, ctx) => {
            if (ctx?.prev) qc.setQueryData<BookingsResponse>(queryKey, ctx.prev);
            toast.error(`Couldn't update the booking: ${err.message}`);
        },
        onSettled: () => qc.invalidateQueries({ queryKey }),
    });
}

// ─────────────── Services ───────────────

export function useServices(tenant: string, enabled: boolean): UseQueryResult<Service[], ApiError> {
    return useQuery<Service[], ApiError>({ queryKey: queryKeys.admin.services(tenant), queryFn: () => fetchServices(tenant), enabled });
}

export function useSaveService(tenant: string): UseMutationResult<Service, ApiError, ServiceInput, Rollback<Service[]>> {
    const qc = useQueryClient();
    const queryKey = queryKeys.admin.services(tenant);
    return useMutation<Service, ApiError, ServiceInput, Rollback<Service[]>>({
        mutationFn: (input) => saveService(tenant, input),
        onMutate: async (input) => {
            await qc.cancelQueries({ queryKey });
            const prev = qc.getQueryData<Service[]>(queryKey);
            qc.setQueryData<Service[]>(queryKey, (old) => {
                if (!old) return old;
                const exists = old.some((s) => s.handle === input.handle);
                return exists ? old.map((s) => (s.handle === input.handle ? { ...s, ...input } : s)) : [...old, { ...input, id: `${PENDING_PREFIX}${input.handle}` }];
            });
            return { prev };
        },
        onSuccess: (s) => toast.success(`${s.name} saved.`),
        onError: (err, _vars, ctx) => {
            if (ctx?.prev) qc.setQueryData<Service[]>(queryKey, ctx.prev);
            toast.error(`Couldn't save the service: ${err.message}`);
        },
        onSettled: () => qc.invalidateQueries({ queryKey }),
    });
}

// ─────────────── Staff ───────────────

export function useStaff(tenant: string, enabled: boolean): UseQueryResult<StaffMember[], ApiError> {
    return useQuery<StaffMember[], ApiError>({ queryKey: queryKeys.admin.staff(tenant), queryFn: () => fetchStaff(tenant), enabled });
}

export function useSaveStaff(tenant: string): UseMutationResult<void, ApiError, StaffInput, Rollback<StaffMember[]>> {
    const qc = useQueryClient();
    const queryKey = queryKeys.admin.staff(tenant);
    return useMutation<void, ApiError, StaffInput, Rollback<StaffMember[]>>({
        mutationFn: (input) => saveStaff(tenant, input),
        onMutate: async (input) => {
            await qc.cancelQueries({ queryKey });
            const prev = qc.getQueryData<StaffMember[]>(queryKey);
            qc.setQueryData<StaffMember[]>(queryKey, (old) => {
                if (!old) return old;
                const exists = old.some((s) => s.handle === input.handle);
                return exists ? old.map((s) => (s.handle === input.handle ? { ...s, ...input } : s)) : [...old, { ...input, id: `${PENDING_PREFIX}${input.handle}` }];
            });
            return { prev };
        },
        onSuccess: (_res, input) => toast.success(`${input.name}'s profile and hours saved.`),
        onError: (err, _vars, ctx) => {
            if (ctx?.prev) qc.setQueryData<StaffMember[]>(queryKey, ctx.prev);
            toast.error(`Couldn't save the stylist: ${err.message}`);
        },
        onSettled: () => qc.invalidateQueries({ queryKey }),
    });
}

// ─────────────── Closures ───────────────

export function useClosures(tenant: string, enabled: boolean): UseQueryResult<Closure[], ApiError> {
    return useQuery<Closure[], ApiError>({ queryKey: queryKeys.admin.closures(tenant), queryFn: () => fetchClosures(tenant), enabled });
}

export function useAddClosure(tenant: string): UseMutationResult<Closure, ApiError, ClosureInput, Rollback<Closure[]>> {
    const qc = useQueryClient();
    const queryKey = queryKeys.admin.closures(tenant);
    return useMutation<Closure, ApiError, ClosureInput, Rollback<Closure[]>>({
        mutationFn: (input) => addClosure(tenant, input),
        onMutate: async (input) => {
            await qc.cancelQueries({ queryKey });
            const prev = qc.getQueryData<Closure[]>(queryKey);
            qc.setQueryData<Closure[]>(queryKey, (old) => (old ? [...old, { ...input, id: `${PENDING_PREFIX}${input.date}-${old.length}` }].sort((a, b) => a.date.localeCompare(b.date)) : old));
            return { prev };
        },
        onSuccess: () => toast.success("Closure added — those slots are no longer bookable."),
        onError: (err, _vars, ctx) => {
            if (ctx?.prev) qc.setQueryData<Closure[]>(queryKey, ctx.prev);
            toast.error(`Couldn't add the closure: ${err.message}`);
        },
        onSettled: () => qc.invalidateQueries({ queryKey }),
    });
}

export function useDeleteClosure(tenant: string): UseMutationResult<void, ApiError, string, Rollback<Closure[]>> {
    const qc = useQueryClient();
    const queryKey = queryKeys.admin.closures(tenant);
    return useMutation<void, ApiError, string, Rollback<Closure[]>>({
        mutationFn: (id) => deleteClosure(tenant, id),
        onMutate: async (id) => {
            await qc.cancelQueries({ queryKey });
            const prev = qc.getQueryData<Closure[]>(queryKey);
            qc.setQueryData<Closure[]>(queryKey, (old) => old?.filter((c) => c.id !== id));
            return { prev };
        },
        onSuccess: () => toast.success("Closure removed — the day is bookable again."),
        onError: (err, _vars, ctx) => {
            if (ctx?.prev) qc.setQueryData<Closure[]>(queryKey, ctx.prev);
            toast.error(`Couldn't remove the closure: ${err.message}`);
        },
        onSettled: () => qc.invalidateQueries({ queryKey }),
    });
}

// ─────────────── Memberships ───────────────

export function useMemberships(tenant: string, enabled: boolean): UseQueryResult<Membership[], ApiError> {
    return useQuery<Membership[], ApiError>({ queryKey: queryKeys.admin.memberships(tenant), queryFn: () => fetchMemberships(tenant), enabled });
}
