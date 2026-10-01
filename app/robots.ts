import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/core/site";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/beauty/account", "/salon/account", "/fashion/account", "/api/"] }],
        sitemap: absoluteUrl("/sitemap.xml"),
    };
}
