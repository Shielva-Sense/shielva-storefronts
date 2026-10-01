"use client";

import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/Toast";
import type { ApiError } from "@/core/api-client";
import { queryKeys } from "@/core/query-keys";
import { adminLogin, adminLogout, fetchAdminMe, type AdminMe } from "./api";

export function useAdminMe(): UseQueryResult<AdminMe, ApiError> {
    return useQuery<AdminMe, ApiError>({ queryKey: queryKeys.admin.me(), queryFn: fetchAdminMe, retry: false, staleTime: 60_000 });
}

export function useAdminLogin(next: string) {
    const qc = useQueryClient();
    const router = useRouter();
    return useMutation({
        mutationFn: ({ email, password }: { email: string; password: string }) => adminLogin(email, password),
        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: ["admin"] });
            router.replace(next);
        },
        onError: (err: Error) => toast.error(err.message),
    });
}

export function useAdminLogout() {
    const qc = useQueryClient();
    const router = useRouter();
    return useMutation({
        mutationFn: adminLogout,
        onSettled: () => {
            qc.removeQueries({ queryKey: ["admin"] });
            router.replace("/admin/login");
        },
    });
}
