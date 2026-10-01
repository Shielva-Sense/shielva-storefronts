export const ADMIN_NAV = [
    { href: "/admin", label: "Dashboard", group: "Insights" },
    { href: "/admin/orders", label: "Orders", group: "Commerce" },
    { href: "/admin/customers", label: "Customers", group: "Commerce" },
    { href: "/admin/catalog", label: "Catalogue", group: "Commerce" },
    { href: "/admin/returns", label: "Returns", group: "Post-purchase" },
    { href: "/admin/reviews", label: "Reviews", group: "Post-purchase" },
    { href: "/admin/pages", label: "Page builder", group: "Content" },
    { href: "/admin/journal", label: "Journal & SEO", group: "Content" },
    { href: "/admin/theme", label: "Theme", group: "Content" },
    { href: "/admin/bookings", label: "Bookings", group: "Salon", storeOnly: "salon" },
    { href: "/admin/audit", label: "Audit log", group: "Security" },
] as const;
