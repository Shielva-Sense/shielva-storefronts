export type ReturnStatus = "requested" | "approved" | "rejected" | "received" | "refunded" | "exchanged";
export type ReturnTarget = Exclude<ReturnStatus, "requested">;

export interface ReturnLine {
    sku: string;
    quantity: number;
    exchangeSku?: string;
}

export interface ReturnRecord {
    id: string;
    shopifyOrderId: string;
    customerEmail: string;
    type: "return" | "exchange";
    status: ReturnStatus;
    reason: string;
    lines: ReturnLine[];
    adminNote: string | null;
    createdAt: string;
    updatedAt: string;
    orderName: string;
    currency: string;
}

export interface ReturnsResponse {
    items: ReturnRecord[];
}

export interface ReturnTransitionInput {
    id: string;
    to: ReturnTarget;
    note?: string;
}

export type ReviewStatus = "pending" | "approved" | "rejected";

export interface AdminReview {
    id: string;
    sku: string;
    customerEmail: string;
    authorName: string;
    rating: number;
    body: string;
    status: ReviewStatus;
    verified: boolean;
    shopifyOrderId: string | null;
    createdAt: string;
}

export interface ReviewsResponse {
    items: AdminReview[];
}

export interface ModerateInput {
    id: string;
    status: Exclude<ReviewStatus, "pending">;
}
