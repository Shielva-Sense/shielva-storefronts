"use client";

import Link from "next/link";
import { Check, MessageSquareText, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { BrandSpinner } from "@/components/ui/ProgressOverlay";
import { StarRating } from "@/components/ui/StarRating";
import { StatSection } from "@/components/ui/StatSection";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TabNav } from "@/components/ui/TabNav";
import { ListLayout } from "@/components/layouts/ListLayout";
import { formatNumber, formatWhen, humanize } from "@/core/formatters";
import { useSearchParam } from "@/core/hooks";
import { useAdmin } from "@/features/admin-session/AdminContext";
import { LoadError, PanelNote } from "@/components/ui/Panel";
import { REVIEW_TABS, REVIEW_TONES, type ReviewTab } from "@/features/admin-postpurchase/constants";
import { useModerateReview, useReviews } from "@/features/admin-postpurchase/hooks";
import styles from "./Reviews.module.scss";

const TAB_PREFIX = "reviews-status";

export function ReviewsClient(): React.JSX.Element {
    const { tenant, can } = useAdmin();
    const canEdit = can("admin");
    const [statusRaw, setStatus] = useSearchParam("status", "pending");
    const status: ReviewTab = REVIEW_TABS.find((t) => t.id === statusRaw)?.id ?? "pending";
    const reviews = useReviews(tenant, status);
    const moderate = useModerateReview(tenant, status);
    const items = reviews.data?.items ?? [];
    const storeQs = `?store=${encodeURIComponent(tenant)}`;

    const avg = items.length ? items.reduce((n, r) => n + r.rating, 0) / items.length : 0;
    const verified = items.filter((r) => r.verified).length;
    const critical = items.filter((r) => r.rating <= 2).length;

    return (
        <ListLayout
            title="Reviews"
            subtitle="Customer reviews wait here until approved — only approved reviews appear on product pages and in rich results. Verified buyers are matched to a paid order."
            stats={
                <StatSection
                    show={reviews.isSuccess && items.length > 0}
                    stats={[
                        { label: status === "all" ? "Reviews" : humanize(status), value: formatNumber(items.length), hint: "Most recent 200" },
                        { label: "Average rating", value: avg.toFixed(1), hint: "Out of 5" },
                        { label: "Verified buyers", value: formatNumber(verified), tone: "success", hint: "Linked to a paid order" },
                        { label: "1–2 stars", value: formatNumber(critical), tone: critical > 0 ? "warning" : "neutral", hint: "Worth a follow-up" },
                    ]}
                />
            }
            tabs={<TabNav label="Review status" idPrefix={TAB_PREFIX} tabs={REVIEW_TABS} active={status} onChange={setStatus} />}
            aboveContent={!canEdit ? <PanelNote>You have view-only access — moderating reviews needs the admin role.</PanelNote> : null}
        >
            <div role="tabpanel" id={`${TAB_PREFIX}-panel`} aria-labelledby={`${TAB_PREFIX}-tab-${status}`}>
                {reviews.isPending ? <BrandSpinner mode="content" message="Loading reviews…" /> : null}
                {reviews.isError ? <LoadError message={`Couldn't load reviews: ${reviews.error.message}`} onRetry={() => void reviews.refetch()} /> : null}
                {reviews.isSuccess && items.length === 0 ? (
                    <EmptyState
                        icon={<MessageSquareText size={32} aria-hidden="true" />}
                        title={status === "pending" ? "Inbox zero — nothing to moderate" : `No ${status === "all" ? "" : `${status} `}reviews`}
                        description="Customers are invited to review a product after delivery. New reviews arrive as pending; approving publishes them on the product page, rejecting keeps them hidden."
                    />
                ) : null}
                {items.length > 0 ? (
                    <ul className={styles.grid}>
                        {items.map((r) => (
                            <li key={r.id}>
                                <article className={styles.card} aria-label={`Review by ${r.authorName}`}>
                                    <div className={styles.head}>
                                        <StarRating value={r.rating} />
                                        <span className={styles.badges}>
                                            {r.verified ? <StatusBadge tone="success">Verified buyer</StatusBadge> : <StatusBadge tone="neutral">Unverified</StatusBadge>}
                                            {status === "all" ? <StatusBadge tone={REVIEW_TONES[r.status]}>{humanize(r.status)}</StatusBadge> : null}
                                        </span>
                                    </div>
                                    <p className={styles.body}>{r.body}</p>
                                    <div className={styles.meta}>
                                        <span className={styles.author}>{r.authorName}</span>
                                        <span>
                                            <Link className={styles.link} href={`/admin/customers/${encodeURIComponent(r.customerEmail)}${storeQs}`}>{r.customerEmail}</Link>
                                        </span>
                                        <span><span className={styles.sku}>{r.sku}</span> · {formatWhen(r.createdAt)}</span>
                                    </div>
                                    <div className={styles.actions}>
                                        {r.status !== "approved" ? (
                                            <Button size="sm" leftIcon={<Check size={14} aria-hidden="true" />} disabled={!canEdit} onClick={() => moderate.mutate({ id: r.id, status: "approved" })}>
                                                Approve<span className="visually-hidden"> review by {r.authorName}</span>
                                            </Button>
                                        ) : null}
                                        {r.status !== "rejected" ? (
                                            <Button size="sm" variant="secondary" leftIcon={<X size={14} aria-hidden="true" />} disabled={!canEdit} onClick={() => moderate.mutate({ id: r.id, status: "rejected" })}>
                                                Reject<span className="visually-hidden"> review by {r.authorName}</span>
                                            </Button>
                                        ) : null}
                                    </div>
                                </article>
                            </li>
                        ))}
                    </ul>
                ) : null}
            </div>
        </ListLayout>
    );
}
