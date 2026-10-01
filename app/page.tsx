import type { Metadata } from "next";
import { PlaybookHub } from "@/features/playbook/components/PlaybookHub";
import { pageMetadata } from "@/core/seo";
import { ROUTES } from "@/core/site";

export const metadata: Metadata = pageMetadata({
    title: "ICP-led storefront design — beauty, salon & fashion | Shielva",
    description: "How page design, conversion widgets, motion and structured data change by ideal customer profile — with three live storefront demos for makeup, salon and clothing brands.",
    path: ROUTES.playbook,
    keywords: ["ecommerce website design", "salon website", "makeup brand website", "fashion ecommerce", "conversion rate optimisation"],
});

export default function PlaybookPage(): React.JSX.Element {
    return <PlaybookHub />;
}
