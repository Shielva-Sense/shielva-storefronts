"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { makeQueryClient } from "@/core/query-client";

export function Providers({ children }: { children: ReactNode }): React.JSX.Element {
    const [client] = useState(makeQueryClient);
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
