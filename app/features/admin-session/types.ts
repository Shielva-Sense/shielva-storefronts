export type AdminRole = "owner" | "admin" | "viewer";

export interface AdminStore {
    slug: string;
    name: string;
    role: AdminRole;
    currency: string;
    status: "active" | "disconnected";
}

export interface AdminMe {
    email: string;
    name: string;
    stores: AdminStore[];
}
