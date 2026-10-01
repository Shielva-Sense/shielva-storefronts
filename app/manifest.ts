import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "Shielva Storefronts",
        short_name: "Storefronts",
        start_url: "/",
        display: "standalone",
        background_color: "#f5f2ec",
        theme_color: "#16130f",
    };
}
